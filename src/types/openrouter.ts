/**
 * OpenRouter Service Types
 *
 * Type definitions for the OpenRouter API integration service.
 * These types define the structure for configuration, requests, responses,
 * and error handling for the OpenRouter LLM API.
 */

export interface OpenRouterConfig {
  apiKey: string;
  endpoint: string;
  defaultModel: string;
  modelParams: ModelParams;
}

export interface ModelParams {
  temperature: number;
  max_tokens: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequestPayload {
  model: string;
  messages: OpenRouterMessage[];
  temperature: number;
  max_tokens: number;
  response_format?: ResponseFormat;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, string>;
  };
}

export interface OpenRouterResponse {
  reply: string;
  usage: number;
}

export interface OpenRouterApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterError {
  code: string;
  message: string;
  type: "auth_error" | "rate_limit_error" | "network_error" | "validation_error" | "api_error";
  details?: unknown;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}
