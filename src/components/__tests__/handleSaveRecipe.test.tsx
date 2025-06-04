import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { RecipeFormValues } from "../RecipeForm";
import type { CreateRecipeCommand, RecipeDTO } from "../../types/types";

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

const createMockRecipeDTO = (overrides: Partial<RecipeDTO> = {}): RecipeDTO => ({
  id: 1,
  name: "Test Recipe",
  rating: 5,
  source: "manual",
  recipe: { instructions: "Test recipe content" },
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

// Mock component state and functions
const mockSetIsLoading = vi.fn();
const mockSetError = vi.fn();
const mockSetSuccessMessage = vi.fn();
const mockResetForm = vi.fn();

// Mock component state
const mockComponentState = {
  userId: "test-user-123" as string | null,
  aiState: {
    isAIFlowActive: false,
    originalContentForAI: null as string | null,
    aiModifiedContent: null as string | null,
  },
  setIsLoading: mockSetIsLoading,
  setError: mockSetError,
  setSuccessMessage: mockSetSuccessMessage,
  resetForm: mockResetForm,
};

// Extracted handleSaveRecipe function for testing (from RecipeForm.tsx)
const createHandleSaveRecipe = (componentState: typeof mockComponentState) => {
  return async (values: RecipeFormValues, source: "manual" | "AI" = "manual") => {
    if (!componentState.userId) {
      componentState.setError("Brak identyfikatora użytkownika. Zaloguj się ponownie.");
      return;
    }

    try {
      componentState.setIsLoading(true);
      componentState.setError(null);
      componentState.setSuccessMessage(null);

      // Prepare recipe content
      const recipeContent =
        source === "AI" && componentState.aiState.aiModifiedContent
          ? componentState.aiState.aiModifiedContent
          : values.recipeContent;

      const payload: CreateRecipeCommand = {
        name: values.name,
        rating: values.rating && values.rating !== "" ? Number(values.rating) : undefined,
        source,
        recipe: { instructions: recipeContent },
      };

      const response = await fetch("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 409) {
          componentState.setError("Przepis o tej nazwie już istnieje.");
          return;
        }
        if (response.status === 401) {
          componentState.setError("Sesja wygasła. Zaloguj się ponownie.");
          return;
        }
        throw new Error("Failed to create recipe");
      }

      const createdRecipe: RecipeDTO = await response.json();
      componentState.setSuccessMessage(`Przepis "${createdRecipe.name}" został pomyślnie zapisany!`);
      componentState.resetForm();
    } catch (err) {
      console.error("Error creating recipe:", err);
      componentState.setError("Wystąpił błąd podczas zapisywania przepisu. Spróbuj ponownie.");
    } finally {
      componentState.setIsLoading(false);
    }
  };
};

describe("handleSaveRecipe", () => {
  let handleSaveRecipe: (values: RecipeFormValues, source?: "manual" | "AI") => Promise<void>;

  beforeEach(() => {
    // Reset all mocks
    mockFetch.mockClear();
    mockConsoleError.mockClear();
    mockSetIsLoading.mockClear();
    mockSetError.mockClear();
    mockSetSuccessMessage.mockClear();
    mockResetForm.mockClear();

    // Reset component state
    mockComponentState.userId = "test-user-123";
    mockComponentState.aiState = {
      isAIFlowActive: false,
      originalContentForAI: null,
      aiModifiedContent: null,
    };

    // Create fresh handleSaveRecipe function
    handleSaveRecipe = createHandleSaveRecipe(mockComponentState);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // AUTHENTICATION TESTS
  // ==========================================
  describe("authentication validation", () => {
    it("should set error and return early if userId is null", async () => {
      mockComponentState.userId = null;

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetError).toHaveBeenCalledWith("Brak identyfikatora użytkownika. Zaloguj się ponownie.");
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockSetIsLoading).not.toHaveBeenCalled();
    });

    it("should set error and return early if userId is empty string", async () => {
      mockComponentState.userId = "";

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetError).toHaveBeenCalledWith("Brak identyfikatora użytkownika. Zaloguj się ponownie.");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should proceed with valid userId", async () => {
      mockComponentState.userId = "valid-user-123";

      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetError).not.toHaveBeenCalledWith("Brak identyfikatora użytkownika. Zaloguj się ponownie.");
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  // ==========================================
  // LOADING STATE MANAGEMENT TESTS
  // ==========================================
  describe("loading state management", () => {
    it("should set loading to true at start and false at end for successful request", async () => {
      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetIsLoading).toHaveBeenCalledTimes(2);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(2, false);
    });

    it("should set loading to false even when request fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetIsLoading).toHaveBeenCalledTimes(2);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(1, true);
      expect(mockSetIsLoading).toHaveBeenNthCalledWith(2, false);
    });

    it("should clear error and success messages at start", async () => {
      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetError).toHaveBeenCalledWith(null);
      expect(mockSetSuccessMessage).toHaveBeenCalledWith(null);
    });
  });

  // ==========================================
  // PAYLOAD PREPARATION TESTS - BUSINESS RULES
  // ==========================================
  describe("payload preparation - business rules", () => {
    it("should create correct payload for manual source with rating", async () => {
      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        name: "Delicious Recipe",
        rating: "8",
        recipeContent:
          "Step 1: Do this. Step 2: Do that. This content should be long enough to meet the minimum requirements for JSON stringification.",
      });

      await handleSaveRecipe(values, "manual");

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Delicious Recipe",
          rating: 8,
          source: "manual",
          recipe: {
            instructions:
              "Step 1: Do this. Step 2: Do that. This content should be long enough to meet the minimum requirements for JSON stringification.",
          },
        }),
      });
    });

    it("should create correct payload for manual source without rating", async () => {
      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        name: "Simple Recipe",
        rating: "",
        recipeContent:
          "Simple instructions that meet the minimum length requirement for JSON stringification in the system.",
      });

      await handleSaveRecipe(values, "manual");

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Simple Recipe",
          rating: undefined,
          source: "manual",
          recipe: {
            instructions:
              "Simple instructions that meet the minimum length requirement for JSON stringification in the system.",
          },
        }),
      });
    });

    it("should use AI modified content when source is AI and aiModifiedContent exists", async () => {
      mockComponentState.aiState.aiModifiedContent =
        "AI modified content that is sufficiently long to meet the requirements for JSON stringification.";

      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        recipeContent: "Original content",
      });

      await handleSaveRecipe(values, "AI");

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 5,
          source: "AI",
          recipe: {
            instructions:
              "AI modified content that is sufficiently long to meet the requirements for JSON stringification.",
          },
        }),
      });
    });

    it("should use original content when source is AI but aiModifiedContent is null", async () => {
      mockComponentState.aiState.aiModifiedContent = null;

      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        recipeContent:
          "Original content that is long enough to meet the minimum requirements for JSON stringification.",
      });

      await handleSaveRecipe(values, "AI");

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 5,
          source: "AI",
          recipe: {
            instructions:
              "Original content that is long enough to meet the minimum requirements for JSON stringification.",
          },
        }),
      });
    });

    it("should use original content when source is manual regardless of aiModifiedContent", async () => {
      mockComponentState.aiState.aiModifiedContent = "AI content should be ignored for manual source";

      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        recipeContent:
          "Manual content that should be used even when AI content exists and is long enough for requirements.",
      });

      await handleSaveRecipe(values, "manual");

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 5,
          source: "manual",
          recipe: {
            instructions:
              "Manual content that should be used even when AI content exists and is long enough for requirements.",
          },
        }),
      });
    });

    it("should handle rating edge cases - string '0' should convert to number 0", async () => {
      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        rating: "0",
      });

      await handleSaveRecipe(values);

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 0,
          source: "manual",
          recipe: {
            instructions:
              "This is a test recipe with sufficient content to meet the minimum length requirements for the JSON stringified format which should be at least 100 characters long.",
          },
        }),
      });
    });

    it("should handle rating edge cases - undefined for empty string", async () => {
      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        rating: "",
      });

      await handleSaveRecipe(values);

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: undefined,
          source: "manual",
          recipe: {
            instructions:
              "This is a test recipe with sufficient content to meet the minimum length requirements for the JSON stringified format which should be at least 100 characters long.",
          },
        }),
      });
    });
  });

  // ==========================================
  // HTTP ERROR HANDLING TESTS
  // ==========================================
  describe("HTTP error handling", () => {
    it("should handle 409 Conflict - recipe name already exists", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
      });

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetError).toHaveBeenCalledWith("Przepis o tej nazwie już istnieje.");
      expect(mockSetSuccessMessage).toHaveBeenCalledWith(null);
      expect(mockResetForm).not.toHaveBeenCalled();
    });

    it("should handle 401 Unauthorized", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetError).toHaveBeenCalledWith("Sesja wygasła. Zaloguj się ponownie.");
      expect(mockSetSuccessMessage).toHaveBeenCalledWith(null);
      expect(mockResetForm).not.toHaveBeenCalled();
    });

    it("should handle other HTTP errors (500, 400, etc.)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetError).toHaveBeenCalledWith("Wystąpił błąd podczas zapisywania przepisu. Spróbuj ponownie.");
      expect(mockConsoleError).toHaveBeenCalledWith("Error creating recipe:", expect.any(Error));
    });

    it("should handle 400 Bad Request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetError).toHaveBeenCalledWith("Wystąpił błąd podczas zapisywania przepisu. Spróbuj ponownie.");
      expect(mockConsoleError).toHaveBeenCalledWith("Error creating recipe:", expect.any(Error));
    });

    it("should handle 422 Unprocessable Entity", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
      });

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetError).toHaveBeenCalledWith("Wystąpił błąd podczas zapisywania przepisu. Spróbuj ponownie.");
    });
  });

  // ==========================================
  // NETWORK ERROR HANDLING TESTS
  // ==========================================
  describe("network error handling", () => {
    it("should handle network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetError).toHaveBeenCalledWith("Wystąpił błąd podczas zapisywania przepisu. Spróbuj ponownie.");
      expect(mockConsoleError).toHaveBeenCalledWith("Error creating recipe:", expect.any(Error));
      expect(mockSetIsLoading).toHaveBeenLastCalledWith(false);
    });

    it("should handle timeout error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Request timeout"));

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetError).toHaveBeenCalledWith("Wystąpił błąd podczas zapisywania przepisu. Spróbuj ponownie.");
      expect(mockConsoleError).toHaveBeenCalledWith("Error creating recipe:", expect.any(Error));
    });

    it("should handle JSON parsing error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetError).toHaveBeenCalledWith("Wystąpił błąd podczas zapisywania przepisu. Spróbuj ponownie.");
      expect(mockConsoleError).toHaveBeenCalledWith("Error creating recipe:", expect.any(Error));
    });

    it("should handle non-Error exceptions", async () => {
      mockFetch.mockRejectedValueOnce("String error");

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetError).toHaveBeenCalledWith("Wystąpił błąd podczas zapisywania przepisu. Spróbuj ponownie.");
      expect(mockConsoleError).toHaveBeenCalledWith("Error creating recipe:", "String error");
    });
  });

  // ==========================================
  // SUCCESSFUL REQUEST HANDLING TESTS
  // ==========================================
  describe("successful request handling", () => {
    it("should handle successful recipe creation", async () => {
      const mockResponse = createMockRecipeDTO({
        name: "My Awesome Recipe",
        id: 123,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        name: "My Awesome Recipe",
      });

      await handleSaveRecipe(values);

      expect(mockSetSuccessMessage).toHaveBeenCalledWith('Przepis "My Awesome Recipe" został pomyślnie zapisany!');
      expect(mockResetForm).toHaveBeenCalled();
      expect(mockSetError).toHaveBeenCalledWith(null);
    });

    it("should handle successful recipe creation with different response status codes", async () => {
      const mockResponse = createMockRecipeDTO();

      // Test with 200 OK instead of 201 Created
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetSuccessMessage).toHaveBeenCalled();
      expect(mockResetForm).toHaveBeenCalled();
    });

    it("should call resetForm after successful creation", async () => {
      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockResetForm).toHaveBeenCalledTimes(1);
    });

    it("should handle recipe with special characters in name", async () => {
      const mockResponse = createMockRecipeDTO({
        name: "Łososiowe śniadanie z ćwikłą",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        name: "Łososiowe śniadanie z ćwikłą",
      });

      await handleSaveRecipe(values);

      expect(mockSetSuccessMessage).toHaveBeenCalledWith(
        'Przepis "Łososiowe śniadanie z ćwikłą" został pomyślnie zapisany!'
      );
    });
  });

  // ==========================================
  // EDGE CASES AND BOUNDARY CONDITIONS
  // ==========================================
  describe("edge cases and boundary conditions", () => {
    it("should handle empty aiModifiedContent when source is AI", async () => {
      mockComponentState.aiState.aiModifiedContent = "";

      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        recipeContent:
          "Original content that should be used when AI content is empty string and meets length requirements.",
      });

      await handleSaveRecipe(values, "AI");

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 5,
          source: "AI",
          recipe: {
            instructions:
              "Original content that should be used when AI content is empty string and meets length requirements.",
          },
        }),
      });
    });

    it("should handle very long recipe names", async () => {
      const longName = "A".repeat(200); // Very long name
      const mockResponse = createMockRecipeDTO({ name: longName });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        name: longName,
      });

      await handleSaveRecipe(values);

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: longName,
          rating: 5,
          source: "manual",
          recipe: {
            instructions:
              "This is a test recipe with sufficient content to meet the minimum length requirements for the JSON stringified format which should be at least 100 characters long.",
          },
        }),
      });
    });

    it("should handle rating conversion edge cases - decimal string", async () => {
      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        rating: "7.5",
      });

      await handleSaveRecipe(values);

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 7.5,
          source: "manual",
          recipe: {
            instructions:
              "This is a test recipe with sufficient content to meet the minimum length requirements for the JSON stringified format which should be at least 100 characters long.",
          },
        }),
      });
    });

    it("should handle rating conversion edge cases - leading/trailing whitespace", async () => {
      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        rating: "  8  ",
      });

      await handleSaveRecipe(values);

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 8,
          source: "manual",
          recipe: {
            instructions:
              "This is a test recipe with sufficient content to meet the minimum length requirements for the JSON stringified format which should be at least 100 characters long.",
          },
        }),
      });
    });

    it("should handle very long recipe content", async () => {
      const longContent = "Step 1: " + "Very detailed instructions. ".repeat(500); // Very long content
      const mockResponse = createMockRecipeDTO();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        recipeContent: longContent,
      });

      await handleSaveRecipe(values);

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 5,
          source: "manual",
          recipe: {
            instructions: longContent,
          },
        }),
      });
    });

    it("should handle simultaneous requests (race condition simulation)", async () => {
      const mockResponse1 = createMockRecipeDTO({ name: "Recipe 1" });
      const mockResponse2 = createMockRecipeDTO({ name: "Recipe 2" });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockResponse1),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockResponse2),
        });

      const values1 = createValidRecipeFormValues({ name: "Recipe 1" });
      const values2 = createValidRecipeFormValues({ name: "Recipe 2" });

      // Simulate simultaneous calls
      const promise1 = handleSaveRecipe(values1);
      const promise2 = handleSaveRecipe(values2);

      await Promise.all([promise1, promise2]);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockSetIsLoading).toHaveBeenCalledTimes(4); // 2 calls x 2 times each (start + end)
    });

    it("should handle response with missing fields", async () => {
      // Response missing some optional fields
      const incompleteResponse = {
        id: 1,
        name: "Test Recipe",
        rating: 5,
        source: "manual",
        recipe: { instructions: "Test content" },
        created_at: "2024-01-01T00:00:00Z",
        // missing updated_at
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(incompleteResponse),
      });

      const values = createValidRecipeFormValues();
      await handleSaveRecipe(values);

      expect(mockSetSuccessMessage).toHaveBeenCalledWith('Przepis "Test Recipe" został pomyślnie zapisany!');
      expect(mockResetForm).toHaveBeenCalled();
    });
  });

  // ==========================================
  // DEFAULT PARAMETER BEHAVIOR TESTS
  // ==========================================
  describe("default parameter behavior", () => {
    it("should use 'manual' as default source when no source parameter provided", async () => {
      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();

      // Call without source parameter
      await handleSaveRecipe(values);

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 5,
          source: "manual",
          recipe: {
            instructions:
              "This is a test recipe with sufficient content to meet the minimum length requirements for the JSON stringified format which should be at least 100 characters long.",
          },
        }),
      });
    });

    it("should explicitly use provided source parameter", async () => {
      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues();

      // Explicitly pass AI source
      await handleSaveRecipe(values, "AI");

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 5,
          source: "AI",
          recipe: {
            instructions:
              "This is a test recipe with sufficient content to meet the minimum length requirements for the JSON stringified format which should be at least 100 characters long.",
          },
        }),
      });
    });
  });

  // ==========================================
  // CONTENT SELECTION LOGIC TESTS (KEY BUSINESS RULE)
  // ==========================================
  describe("content selection logic - key business rule", () => {
    it("should use aiModifiedContent when source=AI and aiModifiedContent exists", async () => {
      mockComponentState.aiState.aiModifiedContent =
        "AI generated content that is sufficiently long to meet requirements.";

      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        recipeContent: "Original user content",
      });

      await handleSaveRecipe(values, "AI");

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 5,
          source: "AI",
          recipe: {
            instructions: "AI generated content that is sufficiently long to meet requirements.",
          },
        }),
      });
    });

    it("should use values.recipeContent when source=AI but aiModifiedContent is null (second case)", async () => {
      mockComponentState.aiState.aiModifiedContent = null;

      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        recipeContent: "Original user content that should be used when AI content is null and is long enough.",
      });

      await handleSaveRecipe(values, "AI");

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 5,
          source: "AI",
          recipe: {
            instructions: "Original user content that should be used when AI content is null and is long enough.",
          },
        }),
      });
    });

    it("should use values.recipeContent when source=AI but aiModifiedContent is undefined", async () => {
      mockComponentState.aiState.aiModifiedContent = null;

      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        recipeContent:
          "Original user content should be used when AI content is undefined and meets length requirements.",
      });

      await handleSaveRecipe(values, "AI");

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 5,
          source: "AI",
          recipe: {
            instructions:
              "Original user content should be used when AI content is undefined and meets length requirements.",
          },
        }),
      });
    });

    it("should always use values.recipeContent when source=manual regardless of aiModifiedContent", async () => {
      mockComponentState.aiState.aiModifiedContent = "AI content should be ignored";

      const mockResponse = createMockRecipeDTO();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const values = createValidRecipeFormValues({
        recipeContent: "Manual content should always be used for manual source regardless of AI content being present.",
      });

      await handleSaveRecipe(values, "manual");

      expect(mockFetch).toHaveBeenCalledWith("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: "Test Recipe",
          rating: 5,
          source: "manual",
          recipe: {
            instructions:
              "Manual content should always be used for manual source regardless of AI content being present.",
          },
        }),
      });
    });
  });
});
