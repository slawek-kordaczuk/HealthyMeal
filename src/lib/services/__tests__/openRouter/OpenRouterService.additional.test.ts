/**
 * Additional Unit Tests for OpenRouterService
 *
 * Tests for:
 * - Constructor validation and initialization
 * - Configuration methods (setSystemMessage, configureModel)
 * - Utility methods (getLastResponse)
 * - Error handling during initialization
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpenRouterService } from "../../OpenRouterService";
import type { ModelParams } from "../../../../types/openrouter";

// Mock environment variables
vi.mock("astro:env", () => ({
  OPENROUTER_API_KEY: undefined,
  OPENROUTER_ENDPOINT: undefined,
  OPENROUTER_REFERER: undefined,
  OPENROUTER_TITLE: undefined,
}));

describe("OpenRouterService - Constructor and Configuration", () => {
  describe("Constructor Validation", () => {
    it("should throw error when no API key is provided", () => {
      expect(() => {
        new OpenRouterService({});
      }).toThrow(
        "OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or provide it in config."
      );
    });

    it("should throw error for invalid API key format", () => {
      expect(() => {
        new OpenRouterService({ apiKey: "short" });
      }).toThrow("Invalid API key format");
    });

    it("should throw error for invalid endpoint URL", () => {
      expect(() => {
        new OpenRouterService({
          apiKey: "valid-api-key-1234567890",
          endpoint: "http://insecure-endpoint.com",
        });
      }).toThrow("Invalid endpoint URL");
    });

    it("should throw error for invalid endpoint format", () => {
      expect(() => {
        new OpenRouterService({
          apiKey: "valid-api-key-1234567890",
          endpoint: "not-a-url",
        });
      }).toThrow("Invalid endpoint URL");
    });

    it("should initialize with valid configuration", () => {
      const service = new OpenRouterService({
        apiKey: "valid-api-key-1234567890",
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
        defaultModel: "gpt-4o-mini",
        modelParams: {
          temperature: 0.8,
          max_tokens: 200,
        },
      });

      expect(service.config.defaultModel).toBe("gpt-4o-mini");
      expect(service.config.modelParams.temperature).toBe(0.8);
      expect(service.config.modelParams.max_tokens).toBe(200);
    });

    it("should apply default configuration when partially provided", () => {
      const service = new OpenRouterService({
        apiKey: "valid-api-key-1234567890",
      });

      expect(service.config.defaultModel).toBe("gpt-4o-mini");
      expect(service.config.modelParams.temperature).toBe(0.7);
      expect(service.config.modelParams.max_tokens).toBe(150);
      expect(service.config.modelParams.top_p).toBe(1.0);
      expect(service.config.modelParams.frequency_penalty).toBe(0);
      expect(service.config.modelParams.presence_penalty).toBe(0);
    });

    it("should validate model parameters during initialization", () => {
      expect(() => {
        new OpenRouterService({
          apiKey: "valid-api-key-1234567890",
          modelParams: {
            temperature: 3.0,
            max_tokens: 150,
          },
        });
      }).toThrow("Temperature must be a number between 0 and 2");

      expect(() => {
        new OpenRouterService({
          apiKey: "valid-api-key-1234567890",
          modelParams: {
            temperature: 0.7,
            max_tokens: -1,
          },
        });
      }).toThrow("Max tokens must be a number between 1 and 4096");

      expect(() => {
        new OpenRouterService({
          apiKey: "valid-api-key-1234567890",
          modelParams: {
            temperature: 0.7,
            max_tokens: 150,
            top_p: 1.5,
          },
        });
      }).toThrow("Top_p must be a number between 0 and 1");

      expect(() => {
        new OpenRouterService({
          apiKey: "valid-api-key-1234567890",
          modelParams: {
            temperature: 0.7,
            max_tokens: 150,
            frequency_penalty: 3.0,
          },
        });
      }).toThrow("Frequency penalty must be a number between -2 and 2");

      expect(() => {
        new OpenRouterService({
          apiKey: "valid-api-key-1234567890",
          modelParams: {
            temperature: 0.7,
            max_tokens: 150,
            presence_penalty: -3.0,
          },
        });
      }).toThrow("Presence penalty must be a number between -2 and 2");
    });
  });

  describe("setSystemMessage()", () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: "valid-api-key-1234567890",
      });
    });

    it("should set a valid system message", () => {
      const systemMessage = "You are a helpful cooking assistant.";

      expect(() => {
        service.setSystemMessage(systemMessage);
      }).not.toThrow();
    });

    it("should reject empty system message", () => {
      expect(() => {
        service.setSystemMessage("");
      }).toThrow("System message cannot be empty and must be less than 10000 characters");
    });

    it("should reject whitespace-only system message", () => {
      expect(() => {
        service.setSystemMessage("   ");
      }).toThrow("System message cannot be empty and must be less than 10000 characters");
    });

    it("should reject system message exceeding maximum length", () => {
      const longMessage = "a".repeat(10001);

      expect(() => {
        service.setSystemMessage(longMessage);
      }).toThrow("System message cannot be empty and must be less than 10000 characters");
    });

    it("should accept system message at maximum allowed length", () => {
      const maxLengthMessage = "a".repeat(10000);

      expect(() => {
        service.setSystemMessage(maxLengthMessage);
      }).not.toThrow();
    });

    it("should sanitize system message", () => {
      const messageWithControlChars = "Hello\u0000\u0001World\u007F";

      expect(() => {
        service.setSystemMessage(messageWithControlChars);
      }).not.toThrow();
    });

    it("should normalize whitespace in system message", () => {
      const messageWithExtraSpaces = "Hello    \n\n\t  World   ";

      expect(() => {
        service.setSystemMessage(messageWithExtraSpaces);
      }).not.toThrow();
    });
  });

  describe("configureModel()", () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: "valid-api-key-1234567890",
      });
    });

    it("should configure model with valid parameters", () => {
      const modelName = "gpt-4-turbo";
      const params: Partial<ModelParams> = {
        temperature: 0.5,
        max_tokens: 500,
        top_p: 0.9,
      };

      service.configureModel(modelName, params);

      expect(service.config.defaultModel).toBe(modelName);
      expect(service.config.modelParams.temperature).toBe(0.5);
      expect(service.config.modelParams.max_tokens).toBe(500);
      expect(service.config.modelParams.top_p).toBe(0.9);
    });

    it("should reject empty model name", () => {
      expect(() => {
        service.configureModel("", { temperature: 0.5 });
      }).toThrow("Model name cannot be empty and must contain only valid characters");
    });

    it("should reject whitespace-only model name", () => {
      expect(() => {
        service.configureModel("   ", { temperature: 0.5 });
      }).toThrow("Model name cannot be empty and must contain only valid characters");
    });

    it("should reject model name with invalid characters", () => {
      expect(() => {
        service.configureModel("model@name!", { temperature: 0.5 });
      }).toThrow("Model name cannot be empty and must contain only valid characters");
    });

    it("should accept model name with valid characters", () => {
      const validModelNames = ["gpt-4o-mini", "claude_3_opus", "model.name", "Model123", "model-name_v2.0"];

      validModelNames.forEach((modelName) => {
        expect(() => {
          service.configureModel(modelName, { temperature: 0.5 });
        }).not.toThrow();
      });
    });

    it("should validate model parameters", () => {
      expect(() => {
        service.configureModel("valid-model", { temperature: 3.0 });
      }).toThrow("Temperature must be a number between 0 and 2");

      expect(() => {
        service.configureModel("valid-model", { max_tokens: 5000 });
      }).toThrow("Max tokens must be a number between 1 and 4096");

      expect(() => {
        service.configureModel("valid-model", { top_p: 1.5 });
      }).toThrow("Top_p must be a number between 0 and 1");

      expect(() => {
        service.configureModel("valid-model", { frequency_penalty: 3.0 });
      }).toThrow("Frequency penalty must be a number between -2 and 2");

      expect(() => {
        service.configureModel("valid-model", { presence_penalty: -3.0 });
      }).toThrow("Presence penalty must be a number between -2 and 2");
    });

    it("should merge parameters with existing configuration", () => {
      // Initial configuration
      service.configureModel("initial-model", {
        temperature: 0.7,
        max_tokens: 150,
        top_p: 1.0,
      });

      // Update only some parameters
      service.configureModel("updated-model", {
        temperature: 0.5,
        max_tokens: 200,
      });

      expect(service.config.defaultModel).toBe("updated-model");
      expect(service.config.modelParams.temperature).toBe(0.5);
      expect(service.config.modelParams.max_tokens).toBe(200);
      expect(service.config.modelParams.top_p).toBe(1.0); // Should remain unchanged
    });
  });

  describe("getLastResponse()", () => {
    let service: OpenRouterService;

    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: "valid-api-key-1234567890",
      });
    });

    it("should return null when no response has been stored", () => {
      expect(service.getLastResponse()).toBeNull();
    });

    it("should return the same as lastResponse property", () => {
      expect(service.getLastResponse()).toBe(service.lastResponse);
    });
  });

  describe("Configuration Edge Cases", () => {
    it("should handle boundary values for model parameters", () => {
      const service = new OpenRouterService({
        apiKey: "valid-api-key-1234567890",
        modelParams: {
          temperature: 0, // Minimum
          max_tokens: 1, // Minimum
          top_p: 0, // Minimum
          frequency_penalty: -2, // Minimum
          presence_penalty: -2, // Minimum
        },
      });

      expect(service.config.modelParams.temperature).toBe(0);
      expect(service.config.modelParams.max_tokens).toBe(1);
      expect(service.config.modelParams.top_p).toBe(0);
      expect(service.config.modelParams.frequency_penalty).toBe(-2);
      expect(service.config.modelParams.presence_penalty).toBe(-2);

      // Test maximum values
      service.configureModel("test-model", {
        temperature: 2, // Maximum
        max_tokens: 4096, // Maximum
        top_p: 1, // Maximum
        frequency_penalty: 2, // Maximum
        presence_penalty: 2, // Maximum
      });

      expect(service.config.modelParams.temperature).toBe(2);
      expect(service.config.modelParams.max_tokens).toBe(4096);
      expect(service.config.modelParams.top_p).toBe(1);
      expect(service.config.modelParams.frequency_penalty).toBe(2);
      expect(service.config.modelParams.presence_penalty).toBe(2);
    });

    it("should handle partial model parameter updates", () => {
      const service = new OpenRouterService({
        apiKey: "valid-api-key-1234567890",
      });

      // Update only temperature
      service.configureModel("test-model", { temperature: 0.9 });

      expect(service.config.modelParams.temperature).toBe(0.9);
      expect(service.config.modelParams.max_tokens).toBe(150); // Should remain default
    });

    it("should handle optional parameters correctly", () => {
      const service = new OpenRouterService({
        apiKey: "valid-api-key-1234567890",
        modelParams: {
          temperature: 0.7,
          max_tokens: 150,
          // Optional parameters not provided
        },
      });

      expect(service.config.modelParams.top_p).toBe(1.0);
      expect(service.config.modelParams.frequency_penalty).toBe(0);
      expect(service.config.modelParams.presence_penalty).toBe(0);
    });
  });
});
