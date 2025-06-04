import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { RecipeFormValues } from "../RecipeForm";
import type { RecipeModificationCommand, RecipeModificationResponseDTO } from "../../types/types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error to suppress error logs in tests
const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {
  // Suppress console.error in tests
});

// Test data factories
const createValidRecipeFormValues = (overrides: Partial<RecipeFormValues> = {}): RecipeFormValues => ({
  name: "Test Recipe",
  rating: "5",
  recipeContent:
    "This is a test recipe with sufficient content to meet the minimum length requirements for the JSON stringified format which should be at least 100 characters long.",
  ...overrides,
});

const createMockModificationResponse = (
  overrides: Partial<RecipeModificationResponseDTO> = {}
): RecipeModificationResponseDTO => ({
  modified_recipe:
    "This is an AI-modified recipe with enhanced instructions and healthier ingredients that meets the minimum length requirements.",
  ...overrides,
});

// Mock state setters and component state
const mockSetIsLoading = vi.fn();
const mockSetError = vi.fn();
const mockSetSuccessMessage = vi.fn();
const mockSetShowPreferencesModal = vi.fn();
const mockSetAiState = vi.fn();

// Mock component state
const mockComponentState = {
  userId: "test-user-123" as string | null | undefined,
  arePreferencesSet: true,
  aiState: {
    isAIFlowActive: false,
    originalContentForAI: null,
    aiModifiedContent: null,
  },
};

// Create handleModifyWithAI function for testing
// This simulates the function extracted from RecipeForm component
const createHandleModifyWithAI = (componentState = mockComponentState) => {
  return async (values: RecipeFormValues) => {
    if (!componentState.userId) {
      mockSetError("Brak identyfikatora użytkownika. Zaloguj się ponownie.");
      return;
    }

    // Check if preferences are set
    if (!componentState.arePreferencesSet) {
      mockSetShowPreferencesModal(true);
      return;
    }

    try {
      mockSetIsLoading(true);
      mockSetError(null);
      mockSetSuccessMessage(null);

      // Set AI flow state
      mockSetAiState({
        isAIFlowActive: true,
        originalContentForAI: values.recipeContent,
        aiModifiedContent: null,
      });

      const payload: RecipeModificationCommand = {
        recipe_text: values.recipeContent,
      };

      const response = await fetch("/api/recipes/modify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to get the error message from the response
        let errorMessage = "Failed to modify recipe with AI";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status-based message
          if (response.status === 422) {
            errorMessage = "User preferences not found. Please set your dietary preferences first.";
          } else if (response.status === 401) {
            errorMessage = "Unauthorized. Please log in again.";
          }
        }
        throw new Error(errorMessage);
      }

      const modificationResult: RecipeModificationResponseDTO = await response.json();

      mockSetAiState((prev: typeof mockComponentState.aiState) => ({
        ...prev,
        aiModifiedContent: modificationResult.modified_recipe,
      }));
    } catch (err) {
      console.error("Error modifying recipe with AI:", err);

      // Check if the error is related to missing preferences
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isPreferencesError =
        errorMessage.toLowerCase().includes("preferences") || errorMessage.toLowerCase().includes("not found");

      if (isPreferencesError) {
        // Don't reset AI flow - show preferences modal instead
        mockSetShowPreferencesModal(true);
        mockSetError("Brak preferencji żywieniowych. Uzupełnij swoje preferencje, aby móc korzystać z modyfikacji AI.");
      } else {
        // For other errors, reset AI flow
        mockSetError("Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie.");
        mockSetAiState({
          isAIFlowActive: false,
          originalContentForAI: null,
          aiModifiedContent: null,
        });
      }
    } finally {
      mockSetIsLoading(false);
    }
  };
};

describe("handleModifyWithAI", () => {
  let handleModifyWithAI: (values: RecipeFormValues) => Promise<void>;

  beforeEach(() => {
    // Reset all mocks
    mockFetch.mockClear();
    mockConsoleError.mockClear();
    mockSetIsLoading.mockClear();
    mockSetError.mockClear();
    mockSetSuccessMessage.mockClear();
    mockSetShowPreferencesModal.mockClear();
    mockSetAiState.mockClear();

    // Reset component state to defaults
    mockComponentState.userId = "test-user-123";
    mockComponentState.arePreferencesSet = true;
    mockComponentState.aiState = {
      isAIFlowActive: false,
      originalContentForAI: null,
      aiModifiedContent: null,
    };

    // Create fresh instance of the function
    handleModifyWithAI = createHandleModifyWithAI(mockComponentState);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // AUTHENTICATION AND AUTHORIZATION TESTS
  // ==========================================
  describe("authentication and authorization", () => {
    it("should return early if userId is null", async () => {
      mockComponentState.userId = null;
      handleModifyWithAI = createHandleModifyWithAI(mockComponentState);

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetError).toHaveBeenCalledWith("Brak identyfikatora użytkownika. Zaloguj się ponownie.");
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockSetIsLoading).not.toHaveBeenCalled();
      expect(mockSetAiState).not.toHaveBeenCalled();
    });

    it("should return early if userId is undefined", async () => {
      mockComponentState.userId = undefined;
      handleModifyWithAI = createHandleModifyWithAI(mockComponentState);

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetError).toHaveBeenCalledWith("Brak identyfikatora użytkownika. Zaloguj się ponownie.");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return early if userId is empty string", async () => {
      mockComponentState.userId = "";
      handleModifyWithAI = createHandleModifyWithAI(mockComponentState);

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetError).toHaveBeenCalledWith("Brak identyfikatora użytkownika. Zaloguj się ponownie.");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // PREFERENCES VALIDATION TESTS
  // ==========================================
  describe("preferences validation", () => {
    it("should show preferences modal if arePreferencesSet is false", async () => {
      mockComponentState.arePreferencesSet = false;
      handleModifyWithAI = createHandleModifyWithAI(mockComponentState);

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetShowPreferencesModal).toHaveBeenCalledWith(true);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockSetIsLoading).not.toHaveBeenCalled();
      expect(mockSetAiState).not.toHaveBeenCalled();
    });

    it("should proceed if arePreferencesSet is true", async () => {
      const mockResponse = createMockModificationResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetShowPreferencesModal).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  // ==========================================
  // STATE MANAGEMENT TESTS
  // ==========================================
  describe("state management", () => {
    it("should set loading to true at start and false at end for successful request", async () => {
      const mockResponse = createMockModificationResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetIsLoading).toHaveBeenCalledTimes(2);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(2, false);
    });

    it("should set loading to false even when request fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetIsLoading).toHaveBeenCalledTimes(2);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(2, false);
    });

    it("should clear error and success messages at start", async () => {
      const mockResponse = createMockModificationResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetError).toHaveBeenCalledWith(null);
      expect(mockSetSuccessMessage).toHaveBeenCalledWith(null);
    });

    it("should set AI flow state correctly at start", async () => {
      const mockResponse = createMockModificationResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        recipeContent: "Original recipe content that will be modified by AI system.",
      });

      await handleModifyWithAI(values);

      expect(mockSetAiState).toHaveBeenCalledWith({
        isAIFlowActive: true,
        originalContentForAI: "Original recipe content that will be modified by AI system.",
        aiModifiedContent: null,
      });
    });
  });

  // ==========================================
  // API PAYLOAD PREPARATION TESTS
  // ==========================================
  describe("API payload preparation", () => {
    it("should create correct payload with recipe content", async () => {
      const mockResponse = createMockModificationResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        recipeContent: "Detailed recipe instructions that will be enhanced by AI processing.",
      });

      await handleModifyWithAI(values);

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/modify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          recipe_text: "Detailed recipe instructions that will be enhanced by AI processing.",
        }),
      });
    });

    it("should handle very long recipe content", async () => {
      const longContent = "Very detailed step-by-step instructions. ".repeat(200);
      const mockResponse = createMockModificationResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        recipeContent: longContent,
      });

      await handleModifyWithAI(values);

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/modify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          recipe_text: longContent,
        }),
      });
    });

    it("should handle recipe content with special characters", async () => {
      const specialContent = 'Recipe with "quotes", ñ characters, and €symbols, plus newlines\nand tabs\t.';
      const mockResponse = createMockModificationResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        recipeContent: specialContent,
      });

      await handleModifyWithAI(values);

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/modify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          recipe_text: specialContent,
        }),
      });
    });
  });

  // ==========================================
  // SUCCESSFUL RESPONSE HANDLING TESTS
  // ==========================================
  describe("successful response handling", () => {
    it("should handle successful AI modification", async () => {
      const mockResponse = createMockModificationResponse({
        modified_recipe: "AI-enhanced recipe with improved nutritional balance and clearer instructions.",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetAiState).toHaveBeenCalledTimes(2);
      // First call sets initial state
      expect(mockSetAiState).toHaveBeenNthCalledWith(1, {
        isAIFlowActive: true,
        originalContentForAI: values.recipeContent,
        aiModifiedContent: null,
      });
      // Second call updates with AI result
      expect(mockSetAiState).toHaveBeenNthCalledWith(2, expect.any(Function));
    });

    it("should handle different success status codes", async () => {
      const mockResponse = createMockModificationResponse();

      // Test 201 Created
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetAiState).toHaveBeenCalledTimes(2);
    });

    it("should handle AI response with very long modified content", async () => {
      const longModifiedContent = "Enhanced step-by-step instructions with detailed nutritional information. ".repeat(
        100
      );
      const mockResponse = createMockModificationResponse({
        modified_recipe: longModifiedContent,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetAiState).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================
  // HTTP ERROR HANDLING TESTS
  // ==========================================
  describe("HTTP error handling", () => {
    it("should handle 401 Unauthorized with JSON error response", async () => {
      const errorResponse = { error: "Token expired", message: "Please login again" };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(errorResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockConsoleError).toHaveBeenCalledWith("Error modifying recipe with AI:", expect.any(Error));
      expect(mockSetError).toHaveBeenCalledWith(
        "Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie."
      );
      expect(mockSetAiState).toHaveBeenCalledWith({
        isAIFlowActive: false,
        originalContentForAI: null,
        aiModifiedContent: null,
      });
    });

    it("should handle 401 Unauthorized without JSON response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.reject(new Error("Not JSON")),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetError).toHaveBeenCalledWith(
        "Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie."
      );
      expect(mockSetAiState).toHaveBeenCalledWith({
        isAIFlowActive: false,
        originalContentForAI: null,
        aiModifiedContent: null,
      });
    });

    it("should handle 422 Unprocessable Entity with JSON error response", async () => {
      const errorResponse = { error: "User preferences not found", message: "Missing dietary preferences" };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve(errorResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetShowPreferencesModal).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(
        "Brak preferencji żywieniowych. Uzupełnij swoje preferencje, aby móc korzystać z modyfikacji AI."
      );
      // AI state should NOT be reset for preferences errors
      expect(mockSetAiState).toHaveBeenCalledTimes(1); // Only initial state setting
    });

    it("should handle 422 Unprocessable Entity without JSON response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.reject(new Error("Not JSON")),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetShowPreferencesModal).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(
        "Brak preferencji żywieniowych. Uzupełnij swoje preferencje, aby móc korzystać z modyfikacji AI."
      );
    });

    it("should handle 500 Internal Server Error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Server error")),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetError).toHaveBeenCalledWith(
        "Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie."
      );
      expect(mockSetAiState).toHaveBeenCalledWith({
        isAIFlowActive: false,
        originalContentForAI: null,
        aiModifiedContent: null,
      });
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network connection failed"));

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockConsoleError).toHaveBeenCalledWith("Error modifying recipe with AI:", expect.any(Error));
      expect(mockSetError).toHaveBeenCalledWith(
        "Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie."
      );
      expect(mockSetAiState).toHaveBeenCalledWith({
        isAIFlowActive: false,
        originalContentForAI: null,
        aiModifiedContent: null,
      });
    });
  });

  // ==========================================
  // PREFERENCES ERROR DETECTION TESTS
  // ==========================================
  describe("preferences error detection logic", () => {
    it("should detect preferences errors by keyword 'preferences'", async () => {
      const errorResponse = { error: "Missing user preferences for AI modification" };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetShowPreferencesModal).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(
        "Brak preferencji żywieniowych. Uzupełnij swoje preferencje, aby móc korzystać z modyfikacji AI."
      );
      // Should NOT reset AI state for preferences errors
      expect(mockSetAiState).toHaveBeenCalledTimes(1);
    });

    it("should detect preferences errors by keyword 'not found'", async () => {
      const errorResponse = { message: "Dietary preferences not found for user" };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetShowPreferencesModal).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(
        "Brak preferencji żywieniowych. Uzupełnij swoje preferencje, aby móc korzystać z modyfikacji AI."
      );
    });

    it("should detect preferences errors case-insensitively", async () => {
      const errorResponse = { error: "PREFERENCES NOT CONFIGURED" };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetShowPreferencesModal).toHaveBeenCalledWith(true);
    });

    it("should NOT detect preferences errors for unrelated messages", async () => {
      const errorResponse = { error: "AI service temporarily unavailable" };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve(errorResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetShowPreferencesModal).not.toHaveBeenCalled();
      expect(mockSetError).toHaveBeenCalledWith(
        "Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie."
      );
      expect(mockSetAiState).toHaveBeenCalledWith({
        isAIFlowActive: false,
        originalContentForAI: null,
        aiModifiedContent: null,
      });
    });
  });

  // ==========================================
  // JSON PARSING ERROR TESTS
  // ==========================================
  describe("JSON parsing error handling", () => {
    it("should handle successful response with invalid JSON", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Unexpected token in JSON")),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockConsoleError).toHaveBeenCalledWith("Error modifying recipe with AI:", expect.any(Error));
      expect(mockSetError).toHaveBeenCalledWith(
        "Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie."
      );
    });

    it("should handle error response with invalid JSON", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Invalid JSON response")),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetError).toHaveBeenCalledWith(
        "Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie."
      );
    });
  });

  // ==========================================
  // ERROR MESSAGE HANDLING TESTS
  // ==========================================
  describe("error message handling", () => {
    it("should handle Error objects correctly", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Specific network error"));

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockConsoleError).toHaveBeenCalledWith("Error modifying recipe with AI:", expect.any(Error));
    });

    it("should handle non-Error objects correctly", async () => {
      mockFetch.mockRejectedValueOnce("String error message");

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockConsoleError).toHaveBeenCalledWith("Error modifying recipe with AI:", "String error message");
      expect(mockSetError).toHaveBeenCalledWith(
        "Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie."
      );
    });

    it("should handle null/undefined errors", async () => {
      mockFetch.mockRejectedValueOnce(null);

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetError).toHaveBeenCalledWith(
        "Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie."
      );
    });
  });

  // ==========================================
  // EDGE CASES AND BOUNDARY CONDITIONS
  // ==========================================
  describe("edge cases and boundary conditions", () => {
    it("should handle concurrent requests", async () => {
      const mockResponse1 = createMockModificationResponse({ modified_recipe: "First AI response" });
      const mockResponse2 = createMockModificationResponse({ modified_recipe: "Second AI response" });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse1),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse2),
        });

      const values1 = createValidRecipeFormValues({ recipeContent: "First recipe content" });
      const values2 = createValidRecipeFormValues({ recipeContent: "Second recipe content" });

      const promise1 = handleModifyWithAI(values1);
      const promise2 = handleModifyWithAI(values2);

      await Promise.all([promise1, promise2]);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockSetIsLoading).toHaveBeenCalledTimes(4); // 2 calls x 2 times each
    });

    it("should handle empty modified recipe response", async () => {
      const mockResponse = createMockModificationResponse({ modified_recipe: "" });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetAiState).toHaveBeenCalledTimes(2);
    });

    it("should handle response with missing modified_recipe field", async () => {
      const incompleteResponse = {};
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(incompleteResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetAiState).toHaveBeenCalledTimes(2);
    });

    it("should handle very slow API response", async () => {
      const mockResponse = createMockModificationResponse();
      const slowPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockResponse),
          });
        }, 100);
      });

      mockFetch.mockReturnValueOnce(slowPromise);

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetIsLoading).toHaveBeenCalledTimes(2);
      expect(mockSetAiState).toHaveBeenCalledTimes(2);
    });

    it("should handle fetch abort scenarios", async () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      mockFetch.mockRejectedValueOnce(abortError);

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      expect(mockSetError).toHaveBeenCalledWith(
        "Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie."
      );
      expect(mockSetIsLoading).toHaveBeenCalledWith(false);
    });
  });

  // ==========================================
  // INTEGRATION SCENARIOS
  // ==========================================
  describe("integration scenarios", () => {
    it("should handle complete success flow", async () => {
      const mockResponse = createMockModificationResponse({
        modified_recipe: "Perfectly enhanced recipe with optimal nutritional balance.",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        name: "Integration Test Recipe",
        recipeContent: "Original recipe content for integration testing.",
      });

      await handleModifyWithAI(values);

      // Verify complete flow
      expect(mockSetError).toHaveBeenCalledWith(null);
      expect(mockSetSuccessMessage).toHaveBeenCalledWith(null);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(1, true);
      expect(mockSetAiState).toHaveBeenCalledWith({
        isAIFlowActive: true,
        originalContentForAI: "Original recipe content for integration testing.",
        aiModifiedContent: null,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/recipes/modify",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })
      );
      expect(mockSetAiState).toHaveBeenCalledTimes(2);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(2, false);
    });

    it("should handle complete preferences error flow", async () => {
      // First check: arePreferencesSet is true, so function proceeds
      // Then API returns preferences error
      const errorResponse = { error: "User preferences not configured for AI modifications" };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve(errorResponse),
      });

      const values = createValidRecipeFormValues();
      await handleModifyWithAI(values);

      // Verify preferences error flow
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(1, true);
      expect(mockSetAiState).toHaveBeenCalledTimes(1); // Only initial setup
      expect(mockSetShowPreferencesModal).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(
        "Brak preferencji żywieniowych. Uzupełnij swoje preferencje, aby móc korzystać z modyfikacji AI."
      );
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(2, false);
    });
  });
});
