/**
 * Unit Tests for OpenRouterService.sendMessage()
 *
 * Tests cover:
 * - Input validation and sanitization
 * - Business logic and request handling
 * - Error scenarios and retry logic
 * - Edge cases and boundary conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from "vitest";
import { OpenRouterService } from "../../OpenRouterService";
import type { OpenRouterApiResponse, ModelParams } from "../../../../types/openrouter";

// Mock fetch globally
const mockFetch = vi.fn() as MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock environment variables
vi.mock("astro:env", () => ({
  OPENROUTER_API_KEY: "test-api-key-1234567890",
  OPENROUTER_ENDPOINT: "https://openrouter.ai/api/v1/chat/completions",
  OPENROUTER_REFERER: "https://localhost:3000",
  OPENROUTER_TITLE: "HealthyMeal App",
}));

describe("OpenRouterService.sendMessage()", () => {
  let service: OpenRouterService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  const validApiResponse: OpenRouterApiResponse = {
    id: "chatcmpl-test-123",
    object: "chat.completion",
    created: 1234567890,
    model: "gpt-4o-mini",
    choices: [
      {
        message: {
          role: "assistant",
          content: "Test response from AI",
        },
        finish_reason: "stop",
        index: 0,
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
    },
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Spy on console methods
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    // Initialize service with test config
    service = new OpenRouterService({
      apiKey: "test-api-key-1234567890",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      defaultModel: "gpt-4o-mini",
      modelParams: {
        temperature: 0.7,
        max_tokens: 150,
      },
    });

    // Setup default successful fetch mock ONLY for non-isolated tests
    // Isolated test suites will override this completely
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => validApiResponse,
      text: async () => JSON.stringify(validApiResponse),
    } as Response);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("Input Validation", () => {
    it("should reject empty message", async () => {
      await expect(service.sendMessage("")).rejects.toThrow(
        "Message cannot be empty and must be less than 10000 characters"
      );
    });

    it("should reject whitespace-only message", async () => {
      await expect(service.sendMessage("   ")).rejects.toThrow(
        "Message cannot be empty and must be less than 10000 characters"
      );
    });

    it("should reject message exceeding maximum length", async () => {
      const longMessage = "a".repeat(10001);
      await expect(service.sendMessage(longMessage)).rejects.toThrow(
        "Message cannot be empty and must be less than 10000 characters"
      );
    });

    it("should accept message at maximum allowed length", async () => {
      const maxLengthMessage = "a".repeat(10000);
      await expect(service.sendMessage(maxLengthMessage)).resolves.toBeDefined();
    });

    it("should validate user options - invalid temperature", async () => {
      const invalidOptions: Partial<ModelParams> = { temperature: 3.0 };

      await expect(service.sendMessage("test", invalidOptions)).rejects.toThrow(
        "Temperature must be a number between 0 and 2"
      );
    });

    it("should validate user options - invalid max_tokens", async () => {
      const invalidOptions: Partial<ModelParams> = { max_tokens: 5000 };

      await expect(service.sendMessage("test", invalidOptions)).rejects.toThrow(
        "Max tokens must be a number between 1 and 4096"
      );
    });

    it("should validate user options - invalid top_p", async () => {
      const invalidOptions: Partial<ModelParams> = { top_p: 1.5 };

      await expect(service.sendMessage("test", invalidOptions)).rejects.toThrow(
        "Top_p must be a number between 0 and 1"
      );
    });
  });

  describe("Message Sanitization", () => {
    it("should sanitize input by removing control characters", async () => {
      const messageWithControlChars = "Hello\u0000\u0001World\u007F";

      await service.sendMessage(messageWithControlChars);

      const capturedRequest = mockFetch.mock.calls[0]?.[1];
      expect(capturedRequest?.body).toBeDefined();

      if (capturedRequest?.body) {
        const requestBody = JSON.parse(capturedRequest.body as string);
        expect(requestBody.messages[1].content).toBe("HelloWorld");
      }
    });

    it("should normalize whitespace in message", async () => {
      const messageWithExtraSpaces = "Hello    \n\n\t  World   ";

      await service.sendMessage(messageWithExtraSpaces);

      const capturedRequest = mockFetch.mock.calls[0]?.[1];
      expect(capturedRequest?.body).toBeDefined();

      if (capturedRequest?.body) {
        const requestBody = JSON.parse(capturedRequest.body as string);
        expect(requestBody.messages[1].content).toBe("Hello World");
      }
    });
  });

  describe("Request Payload Building", () => {
    it("should build correct request payload with default parameters", async () => {
      await service.sendMessage("test message");

      const capturedRequest = mockFetch.mock.calls[0]?.[1];
      expect(capturedRequest?.body).toBeDefined();

      if (capturedRequest?.body) {
        const requestBody = JSON.parse(capturedRequest.body as string);
        expect(requestBody).toEqual({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "System: You are interacting with an intelligent assistant leveraging OpenRouter API.",
            },
            {
              role: "user",
              content: "test message",
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
          top_p: 1.0,
          frequency_penalty: 0,
          presence_penalty: 0,
          provider: {
            allow_fallbacks: false,
            require_parameters: true,
          },
        });
      }
    });

    it("should override default parameters with user options", async () => {
      const userOptions: Partial<ModelParams> = {
        temperature: 0.5,
        max_tokens: 200,
        top_p: 0.8,
      };

      await service.sendMessage("test message", userOptions);

      const capturedRequest = mockFetch.mock.calls[0]?.[1];
      expect(capturedRequest?.body).toBeDefined();

      if (capturedRequest?.body) {
        const requestBody = JSON.parse(capturedRequest.body as string);
        expect(requestBody.temperature).toBe(0.5);
        expect(requestBody.max_tokens).toBe(200);
        expect(requestBody.top_p).toBe(0.8);
      }
    });

    it("should include custom system message when set", async () => {
      service.setSystemMessage("Custom system message");

      await service.sendMessage("test message");

      const capturedRequest = mockFetch.mock.calls[0]?.[1];
      expect(capturedRequest?.body).toBeDefined();

      if (capturedRequest?.body) {
        const requestBody = JSON.parse(capturedRequest.body as string);
        expect(requestBody.messages[0].content).toBe("Custom system message");
      }
    });

    it("should set correct headers", async () => {
      await service.sendMessage("test message");

      const capturedRequest = mockFetch.mock.calls[0]?.[1];
      expect(capturedRequest?.headers).toBeDefined();

      if (capturedRequest?.headers) {
        const headers = capturedRequest.headers as Record<string, string>;
        expect(headers).toEqual({
          "Content-Type": "application/json",
          Authorization: "Bearer test-api-key-1234567890",
          "HTTP-Referer": "https://localhost:3000",
          "X-Title": "HealthyMeal App",
        });
      }
    });
  });

  describe("Successful Response Handling", () => {
    it("should return correct response format on success", async () => {
      const result = await service.sendMessage("test message");

      expect(result).toEqual({
        reply: "Test response from AI",
        usage: 15,
      });
    });

    it("should store last response", async () => {
      const result = await service.sendMessage("test message");

      expect(service.getLastResponse()).toEqual(result);
      expect(service.lastResponse).toEqual(result);
    });

    it("should handle response without usage information", async () => {
      const responseWithoutUsage: OpenRouterApiResponse = {
        id: "chatcmpl-test-456",
        object: "chat.completion",
        created: 1234567890,
        model: "gpt-4o-mini",
        choices: [
          {
            message: {
              role: "assistant",
              content: "Response without usage",
            },
            finish_reason: "stop",
            index: 0,
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseWithoutUsage,
      } as Response);

      const result = await service.sendMessage("test message");

      expect(result).toEqual({
        reply: "Response without usage",
        usage: 0,
      });
    });
  });

  describe("Error Handling - HTTP Errors", () => {
    let isolatedService: OpenRouterService;

    beforeEach(() => {
      // Create isolated service for error tests
      isolatedService = new OpenRouterService({
        apiKey: "test-api-key-1234567890",
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
        defaultModel: "gpt-4o-mini",
      });
    });

    it("should handle 401 authentication error", async () => {
      mockFetch.mockClear().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: "Unauthorized" }),
      } as Response);

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Authentication failed");
    });

    it("should handle 429 rate limit error", async () => {
      // Mock 4 consecutive 429 errors to exhaust all retry attempts
      mockFetch.mockClear();
      for (let i = 0; i < 4; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => JSON.stringify({ message: "Too many requests" }),
        } as Response);
      }

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Rate limit exceeded");
    }, 15000);

    it("should handle 400 bad request error", async () => {
      mockFetch.mockClear().mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: "Bad request" }),
      } as Response);

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Bad request");
    });

    it("should handle 500 server error", async () => {
      // Mock 4 consecutive 500 errors to exhaust all retry attempts
      mockFetch.mockClear();
      for (let i = 0; i < 4; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => JSON.stringify({ message: "Internal server error" }),
        } as Response);
      }

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Server error");
    }, 15000);

    it("should handle unknown HTTP error", async () => {
      // Mock 4 consecutive 503 errors to exhaust all retry attempts (503 >= 500 so it retries)
      mockFetch.mockReset();
      for (let i = 0; i < 4; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          text: async () => JSON.stringify({ message: "Service unavailable" }),
        } as Response);
      }

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("HTTP 503");
    }, 15000);

    it("should handle malformed error response", async () => {
      // Completely reset and override global mock
      mockFetch.mockClear().mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Invalid JSON response",
      } as Response);

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Bad request");
    });
  });

  describe("Error Handling - API Response Validation", () => {
    let isolatedService: OpenRouterService;

    beforeEach(() => {
      isolatedService = new OpenRouterService({
        apiKey: "test-api-key-1234567890",
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
        defaultModel: "gpt-4o-mini",
      });
    });

    it("should handle response without choices", async () => {
      const invalidResponse = { usage: { total_tokens: 10 } };

      mockFetch.mockClear().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => invalidResponse,
      } as Response);

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Invalid API response: no choices found");
    });

    it("should handle response with empty choices array", async () => {
      const invalidResponse = { choices: [], usage: { total_tokens: 10 } };

      mockFetch.mockClear().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => invalidResponse,
      } as Response);

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Invalid API response: no choices found");
    });

    it("should handle response without message content", async () => {
      const invalidResponse = {
        choices: [{ message: {}, finish_reason: "stop", index: 0 }],
        usage: { total_tokens: 10 },
      };

      mockFetch.mockClear().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => invalidResponse,
      } as Response);

      await expect(isolatedService.sendMessage("test")).rejects.toThrow(
        "Invalid API response: no message content found"
      );
    });
  });

  describe("Network Error Handling", () => {
    let isolatedService: OpenRouterService;

    beforeEach(() => {
      // Create a new service instance for network error tests
      isolatedService = new OpenRouterService({
        apiKey: "test-api-key-1234567890",
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
        defaultModel: "gpt-4o-mini",
      });
    });

    it("should handle network timeout", async () => {
      // Mock 4 consecutive timeout errors to exhaust all retry attempts
      mockFetch.mockReset();
      for (let i = 0; i < 4; i++) {
        mockFetch.mockRejectedValueOnce(new Error("Network timeout"));
      }

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Network timeout");
      expect(consoleSpy).toHaveBeenCalledWith("OpenRouter Service Error:", expect.any(Object));
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    }, 15000);

    it("should handle fetch failure", async () => {
      // Mock 4 consecutive fetch failures to exhaust all retry attempts
      mockFetch.mockReset();
      for (let i = 0; i < 4; i++) {
        mockFetch.mockRejectedValueOnce(new Error("fetch failed"));
      }

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("fetch failed");
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    }, 15000);

    it("should handle unknown network error", async () => {
      // Mock unknown error - plain strings are not retried by the service
      // Only Error objects with specific keywords are retried
      mockFetch.mockReset();
      mockFetch.mockRejectedValueOnce("Unknown error");

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Network error: Unknown error");
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for plain string errors
    }, 15000);
  });

  describe("Retry Logic", () => {
    let isolatedService: OpenRouterService;

    beforeEach(() => {
      isolatedService = new OpenRouterService({
        apiKey: "test-api-key-1234567890",
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
        defaultModel: "gpt-4o-mini",
      });
    });

    it("should retry on 429 rate limit error", async () => {
      // First call fails with 429, second succeeds
      mockFetch
        .mockReset()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => JSON.stringify({ message: "Rate limited" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => validApiResponse,
        } as Response);

      const result = await isolatedService.sendMessage("test");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.reply).toBe("Test response from AI");
    }, 10000);

    it("should retry on 500 server error", async () => {
      // First call fails with 500, second succeeds
      mockFetch
        .mockReset()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => JSON.stringify({ message: "Server error" }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => validApiResponse,
        } as Response);

      const result = await isolatedService.sendMessage("test");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.reply).toBe("Test response from AI");
    }, 10000);

    it("should retry on network errors", async () => {
      // First call fails with network error, second succeeds
      mockFetch
        .mockReset()
        .mockRejectedValueOnce(new Error("Network connection failed"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => validApiResponse,
        } as Response);

      const result = await isolatedService.sendMessage("test");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.reply).toBe("Test response from AI");
    }, 10000);

    it("should not retry on 401 authentication error", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: "Unauthorized" }),
      } as Response);

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Authentication failed");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should not retry on 400 bad request", async () => {
      mockFetch.mockReset().mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: "Bad request" }),
      } as Response);

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Bad request");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should stop retrying after max attempts", async () => {
      // All calls fail with 500 - mock 4 consecutive failures
      mockFetch.mockReset();
      for (let i = 0; i < 4; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => JSON.stringify({ message: "Server error" }),
        } as Response);
      }

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Server error");
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    }, 15000);

    it("should handle 429 rate limit error after exhausting retries", async () => {
      // All calls fail with 429 - mock 4 consecutive failures
      mockFetch.mockReset();
      for (let i = 0; i < 4; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => JSON.stringify({ message: "Rate limited" }),
        } as Response);
      }

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Rate limit exceeded");
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    }, 15000);
  });

  describe("Error Logging", () => {
    let isolatedService: OpenRouterService;

    beforeEach(() => {
      isolatedService = new OpenRouterService({
        apiKey: "test-api-key-1234567890",
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
        defaultModel: "gpt-4o-mini",
      });
    });

    it("should log errors with proper context", async () => {
      const testError = new Error("Test error");

      // Mock 4 consecutive errors to exhaust retries
      mockFetch.mockReset();
      for (let i = 0; i < 4; i++) {
        mockFetch.mockRejectedValueOnce(testError);
      }

      await expect(isolatedService.sendMessage("test")).rejects.toThrow("Test error");

      expect(consoleSpy).toHaveBeenCalledWith(
        "OpenRouter Service Error:",
        expect.objectContaining({
          timestamp: expect.any(String),
          service: "OpenRouterService",
          endpoint: "https://openrouter.ai/api/v1/chat/completions",
          model: "gpt-4o-mini",
          error: expect.objectContaining({
            name: "Error",
            message: "Test error",
            stack: expect.any(String),
          }),
        })
      );
    }, 15000);
  });

  describe("Edge Cases", () => {
    let isolatedService: OpenRouterService;

    beforeEach(() => {
      isolatedService = new OpenRouterService({
        apiKey: "test-api-key-1234567890",
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
        defaultModel: "gpt-4o-mini",
      });

      // Set up successful mock for edge case tests
      mockFetch.mockReset().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => validApiResponse,
        text: async () => JSON.stringify(validApiResponse),
      } as Response);
    });

    it("should handle message at exact boundary lengths", async () => {
      // Test with message of exactly 1 character
      await expect(isolatedService.sendMessage("a")).resolves.toBeDefined();

      // Test with message at exact maximum length
      const maxMessage = "a".repeat(10000);
      await expect(isolatedService.sendMessage(maxMessage)).resolves.toBeDefined();
    });

    it("should handle unicode characters correctly", async () => {
      const unicodeMessage = "🚀 Hello 世界 🌟";

      await isolatedService.sendMessage(unicodeMessage);

      const capturedRequest = mockFetch.mock.calls[0]?.[1];
      expect(capturedRequest?.body).toBeDefined();

      if (capturedRequest?.body) {
        const requestBody = JSON.parse(capturedRequest.body as string);
        expect(requestBody.messages[1].content).toBe(unicodeMessage);
      }
    });

    it("should handle concurrent requests", async () => {
      const promises = [
        isolatedService.sendMessage("message 1"),
        isolatedService.sendMessage("message 2"),
        isolatedService.sendMessage("message 3"),
      ];

      await Promise.all(promises);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
