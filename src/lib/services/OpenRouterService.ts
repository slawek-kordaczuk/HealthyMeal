/**
 * OpenRouter Service
 *
 * Service for integrating with the OpenRouter API to process LLM-based chats.
 * Handles message processing, response formatting, and error management.
 */

import type {
  OpenRouterConfig,
  ModelParams,
  OpenRouterMessage,
  OpenRouterRequestPayload,
  OpenRouterResponse,
  OpenRouterApiResponse,
  RetryConfig,
} from "../../types/openrouter";

export class OpenRouterService {
  // Public fields
  public lastResponse: OpenRouterResponse | null = null;
  public config: OpenRouterConfig;

  // Private fields
  private _apiKey: string;
  private _endpoint: string;
  private _currentConfig: OpenRouterConfig;
  private _systemMessage: string;
  private _retryConfig: RetryConfig;

  constructor(config: Partial<OpenRouterConfig> = {}) {
    // Validate required environment variables
    const apiKey = config.apiKey || import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or provide it in config."
      );
    }

    // Validate API key format (basic security check)
    if (!this._isValidApiKey(apiKey)) {
      throw new Error("Invalid API key format");
    }

    // Initialize configuration with defaults
    this._apiKey = apiKey;
    this._endpoint =
      config.endpoint || import.meta.env.OPENROUTER_ENDPOINT || "https://openrouter.ai/api/v1/chat/completions";

    // Validate endpoint URL
    if (!this._isValidUrl(this._endpoint)) {
      throw new Error("Invalid endpoint URL");
    }

    const defaultModelParams: ModelParams = {
      temperature: 0.7,
      max_tokens: 150,
      top_p: 1.0,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    this._currentConfig = {
      apiKey: this._apiKey,
      endpoint: this._endpoint,
      defaultModel: config.defaultModel || "gpt-4o-mini",
      modelParams: { ...defaultModelParams, ...config.modelParams },
    };

    // Validate model parameters
    this._validateModelParams(this._currentConfig.modelParams);

    this.config = { ...this._currentConfig };

    // Initialize default system message
    this._systemMessage = "System: You are interacting with an intelligent assistant leveraging OpenRouter API.";

    // Initialize retry configuration
    this._retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    };
  }

  // Public methods
  public async sendMessage(message: string, userOptions?: Partial<ModelParams>): Promise<OpenRouterResponse> {
    // Enhanced input validation
    if (!this._isValidMessage(message)) {
      throw new Error("Message cannot be empty and must be less than 10000 characters");
    }

    // Sanitize input
    const sanitizedMessage = this._sanitizeInput(message);

    // Validate user options if provided
    if (userOptions) {
      this._validateModelParams(userOptions);
    }

    try {
      const payload = this._buildRequestPayload(this._systemMessage, sanitizedMessage, userOptions);
      const apiResponse = await this._makeApiCall(payload);
      const response = await this._handleApiResponse(apiResponse);

      this.lastResponse = response;
      return response;
    } catch (error) {
      this._logError(error as Error);
      throw error;
    }
  }

  public setSystemMessage(systemMsg: string): void {
    if (!this._isValidMessage(systemMsg)) {
      throw new Error("System message cannot be empty and must be less than 10000 characters");
    }

    this._systemMessage = this._sanitizeInput(systemMsg);
  }

  public configureModel(modelName: string, params: Partial<ModelParams>): void {
    if (!this._isValidModelName(modelName)) {
      throw new Error("Model name cannot be empty and must contain only valid characters");
    }

    // Validate model parameters
    this._validateModelParams(params);

    // Update current configuration
    this._currentConfig.defaultModel = modelName;
    this._currentConfig.modelParams = { ...this._currentConfig.modelParams, ...params };

    // Update public config
    this.config = { ...this._currentConfig };
  }

  public getLastResponse(): OpenRouterResponse | null {
    return this.lastResponse;
  }

  // Private methods
  private _buildRequestPayload(
    systemMsg: string,
    userMsg: string,
    options?: Partial<ModelParams>
  ): OpenRouterRequestPayload {
    // Build messages array with system and user messages
    const messages: OpenRouterMessage[] = [
      {
        role: "system",
        content: systemMsg,
      },
      {
        role: "user",
        content: userMsg,
      },
    ];

    // Merge user options with current configuration
    const modelParams = { ...this._currentConfig.modelParams, ...options };

    // Build the complete request payload
    const payload: OpenRouterRequestPayload = {
      model: this._currentConfig.defaultModel,
      messages,
      temperature: modelParams.temperature,
      max_tokens: modelParams.max_tokens,
      // Add provider configuration to disable fallbacks and enforce specific model
      provider: {
        allow_fallbacks: false, // Disable automatic fallbacks to other providers
        require_parameters: true, // Only use providers that support all parameters
      },
    };

    // Add optional parameters if they exist
    if (modelParams.top_p !== undefined) {
      payload.top_p = modelParams.top_p;
    }
    if (modelParams.frequency_penalty !== undefined) {
      payload.frequency_penalty = modelParams.frequency_penalty;
    }
    if (modelParams.presence_penalty !== undefined) {
      payload.presence_penalty = modelParams.presence_penalty;
    }

    return payload;
  }

  private async _handleApiResponse(response: OpenRouterApiResponse): Promise<OpenRouterResponse> {
    // Validate response structure
    if (!response.choices || response.choices.length === 0) {
      throw new Error("Invalid API response: no choices found");
    }

    const choice = response.choices[0];
    if (!choice.message || !choice.message.content) {
      throw new Error("Invalid API response: no message content found");
    }

    // Return plain text response
    return {
      reply: choice.message.content,
      usage: response.usage?.total_tokens || 0,
    };
  }

  private async _makeApiCall(payload: OpenRouterRequestPayload): Promise<OpenRouterApiResponse> {
    return this._makeApiCallWithRetry(payload, 0);
  }

  private async _makeApiCallWithRetry(
    payload: OpenRouterRequestPayload,
    attempt: number
  ): Promise<OpenRouterApiResponse> {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this._apiKey}`,
      "HTTP-Referer": import.meta.env.OPENROUTER_REFERER || "https://localhost:3000",
      "X-Title": import.meta.env.OPENROUTER_TITLE || "HealthyMeal App",
    };

    try {
      const response = await fetch(this._endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const shouldRetry = this._shouldRetry(response.status, attempt);
        if (shouldRetry) {
          const delay = this._calculateRetryDelay(attempt);
          console.warn(`API call failed (attempt ${attempt + 1}), retrying in ${delay}ms...`);
          await this._sleep(delay);
          return this._makeApiCallWithRetry(payload, attempt + 1);
        }
        await this._handleHttpError(response);
      }

      const data = await response.json();
      return data as OpenRouterApiResponse;
    } catch (error) {
      const shouldRetry = this._shouldRetryOnError(error, attempt);
      if (shouldRetry) {
        const delay = this._calculateRetryDelay(attempt);
        console.warn(`Network error (attempt ${attempt + 1}), retrying in ${delay}ms...`, error);
        await this._sleep(delay);
        return this._makeApiCallWithRetry(payload, attempt + 1);
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Network error: ${String(error)}`);
    }
  }

  private _shouldRetry(statusCode: number, attempt: number): boolean {
    if (attempt >= this._retryConfig.maxRetries) {
      return false;
    }

    // Retry on rate limiting and server errors
    return statusCode === 429 || statusCode >= 500;
  }

  private _shouldRetryOnError(error: unknown, attempt: number): boolean {
    if (attempt >= this._retryConfig.maxRetries) {
      return false;
    }

    // Retry on network errors but not on validation or auth errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("network") ||
        message.includes("timeout") ||
        message.includes("connection") ||
        message.includes("fetch")
      );
    }

    return false;
  }

  private _calculateRetryDelay(attempt: number): number {
    const delay = this._retryConfig.baseDelay * Math.pow(this._retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this._retryConfig.maxDelay);
  }

  private async _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async _handleHttpError(response: Response): Promise<never> {
    const errorText = await response.text();
    let errorData;

    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }

    switch (response.status) {
      case 401:
        throw new Error(`Authentication failed: ${errorData.message || "Invalid API key"}`);
      case 429:
        throw new Error(`Rate limit exceeded: ${errorData.message || "Too many requests"}`);
      case 400:
        throw new Error(`Bad request: ${errorData.message || "Invalid request format"}`);
      case 500:
        throw new Error(`Server error: ${errorData.message || "Internal server error"}`);
      default:
        throw new Error(`HTTP ${response.status}: ${errorData.message || "Unknown error"}`);
    }
  }

  private _logError(error: Error): void {
    const timestamp = new Date().toISOString();
    const errorContext = {
      timestamp,
      service: "OpenRouterService",
      endpoint: this._endpoint,
      model: this._currentConfig.defaultModel,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    };

    // Log to console with structured format
    console.error("OpenRouter Service Error:", errorContext);

    // In production, you might want to send this to a logging service
    if (import.meta.env.NODE_ENV === "production") {
      // TODO: Integrate with logging service (e.g., Sentry, LogRocket, etc.)
      // Example: loggerService.error('OpenRouter API Error', errorContext);
    }
  }

  // Validation and security methods
  private _isValidApiKey(apiKey: string): boolean {
    // Basic API key validation - should be non-empty and reasonable length
    return typeof apiKey === "string" && apiKey.length >= 10 && apiKey.length <= 200;
  }

  private _isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  }

  private _isValidMessage(message: string): boolean {
    return typeof message === "string" && message.trim().length > 0 && message.length <= 10000;
  }

  private _isValidModelName(modelName: string): boolean {
    return typeof modelName === "string" && modelName.trim().length > 0 && /^[a-zA-Z0-9\-_.]+$/.test(modelName);
  }

  private _validateModelParams(params: Partial<ModelParams>): void {
    if (params.temperature !== undefined) {
      if (typeof params.temperature !== "number" || params.temperature < 0 || params.temperature > 2) {
        throw new Error("Temperature must be a number between 0 and 2");
      }
    }

    if (params.max_tokens !== undefined) {
      if (typeof params.max_tokens !== "number" || params.max_tokens < 1 || params.max_tokens > 4096) {
        throw new Error("Max tokens must be a number between 1 and 4096");
      }
    }

    if (params.top_p !== undefined) {
      if (typeof params.top_p !== "number" || params.top_p < 0 || params.top_p > 1) {
        throw new Error("Top_p must be a number between 0 and 1");
      }
    }

    if (params.frequency_penalty !== undefined) {
      if (
        typeof params.frequency_penalty !== "number" ||
        params.frequency_penalty < -2 ||
        params.frequency_penalty > 2
      ) {
        throw new Error("Frequency penalty must be a number between -2 and 2");
      }
    }

    if (params.presence_penalty !== undefined) {
      if (typeof params.presence_penalty !== "number" || params.presence_penalty < -2 || params.presence_penalty > 2) {
        throw new Error("Presence penalty must be a number between -2 and 2");
      }
    }
  }

  private _sanitizeInput(input: string): string {
    // Remove potentially dangerous characters and normalize whitespace
    return input
      .replace(/[\p{Cc}]/gu, "") // Remove control characters using Unicode property
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }
}
