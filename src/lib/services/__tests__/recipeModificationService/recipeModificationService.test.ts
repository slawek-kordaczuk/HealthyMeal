import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { RecipeModificationService } from "../../recipeModificationService";
import { PreferencesService } from "../../preferencesService";
import { OpenRouterService } from "../../OpenRouterService";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PreferencesDTO, RecipeModificationErrorCommand } from "../../../../types/types";

// Mock types for better type safety
interface MockSupabaseClient {
  from: MockedFunction<(table: string) => MockSupabaseQueryBuilder>;
}

interface MockSupabaseQueryBuilder {
  insert: MockedFunction<(data: Record<string, unknown>) => Promise<{ error: unknown }>>;
}

interface MockPreferencesService {
  getUserPreferences: MockedFunction<(userId: string) => Promise<PreferencesDTO | null>>;
}

interface MockOpenRouterService {
  sendMessage: MockedFunction<(message: string, options?: Record<string, unknown>) => Promise<{ reply: string }>>;
  setSystemMessage: MockedFunction<(message: string) => void>;
  config: {
    defaultModel: string;
  };
}

// Mock modules
vi.mock("../../preferencesService");
vi.mock("../../OpenRouterService");

// Test data fixtures
const mockUserId = "user-123";
const mockRecipeText = `
Spaghetti Carbonara
Ingredients:
- 400g spaghetti
- 200g pancetta
- 4 large eggs
- 100g Pecorino Romano cheese
- Black pepper
- Salt

Instructions:
1. Cook spaghetti according to package directions
2. Fry pancetta until crispy
3. Mix eggs with cheese
4. Combine everything with pasta
5. Serve immediately
`;

const mockPreferences: PreferencesDTO = {
  id: 1,
  userId: mockUserId,
  diet_type: "vegetarian",
  daily_calorie_requirement: 2000,
  allergies: "eggs",
  food_intolerances: "lactose",
  preferred_cuisines: "Italian",
  excluded_ingredients: "meat",
  macro_distribution_protein: 25,
  macro_distribution_fats: 30,
  macro_distribution_carbohydrates: 45,
};

const mockModifiedRecipe = `
Vegetarian Spaghetti Carbonara
Ingredients:
- 400g spaghetti
- 200g mushrooms (replacing pancetta)
- 4 large egg substitutes (replacing eggs)
- 100g nutritional yeast (replacing Pecorino Romano)
- Black pepper
- Salt

Instructions:
1. Cook spaghetti according to package directions
2. Sauté mushrooms until golden
3. Mix egg substitutes with nutritional yeast
4. Combine everything with pasta
5. Serve immediately
`;

describe("RecipeModificationService", () => {
  let service: RecipeModificationService;
  let mockSupabase: MockSupabaseClient;
  let mockQueryBuilder: MockSupabaseQueryBuilder;
  let mockPreferencesService: MockPreferencesService;
  let mockOpenRouterService: MockOpenRouterService;

  beforeEach(() => {
    // Create mock query builder
    mockQueryBuilder = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    // Create mock preferences service
    mockPreferencesService = {
      getUserPreferences: vi.fn(),
    };

    // Create mock OpenRouter service
    mockOpenRouterService = {
      sendMessage: vi.fn(),
      setSystemMessage: vi.fn(),
      config: {
        defaultModel: "gpt-4o-mini",
      },
    };

    // Mock the constructors
    vi.mocked(PreferencesService).mockImplementation(() => mockPreferencesService as unknown as PreferencesService);
    vi.mocked(OpenRouterService).mockImplementation(() => mockOpenRouterService as unknown as OpenRouterService);

    // Create service instance
    service = new RecipeModificationService(mockSupabase as unknown as SupabaseClient);
  });

  describe("modifyRecipe", () => {
    // ==========================================
    // TESTY POZYTYWNE - UDANE MODYFIKACJE
    // ==========================================
    describe("successful recipe modifications", () => {
      beforeEach(() => {
        mockPreferencesService.getUserPreferences.mockResolvedValue(mockPreferences);
        mockOpenRouterService.sendMessage.mockResolvedValue({ reply: mockModifiedRecipe });
      });

      it("should successfully modify recipe with user preferences", async () => {
        // Act
        const result = await service.modifyRecipe(mockRecipeText, mockUserId);

        // Assert
        expect(result).toBe(mockModifiedRecipe);
        expect(mockPreferencesService.getUserPreferences).toHaveBeenCalledWith(mockUserId);
        expect(mockOpenRouterService.sendMessage).toHaveBeenCalledWith(
          expect.stringContaining("DIETARY PREFERENCES:"),
          expect.objectContaining({
            temperature: 0.7,
            max_tokens: 2000,
          })
        );
      });

      it("should include all preference types in modification prompt", async () => {
        // Act
        await service.modifyRecipe(mockRecipeText, mockUserId);

        // Assert
        const callArgs = mockOpenRouterService.sendMessage.mock.calls[0][0];
        expect(callArgs).toContain("Diet type: vegetarian");
        expect(callArgs).toContain("Target daily calories: 2000");
        expect(callArgs).toContain("Allergies: eggs");
        expect(callArgs).toContain("Food intolerances: lactose");
        expect(callArgs).toContain("Preferred cuisines: Italian");
        expect(callArgs).toContain("Ingredients to avoid: meat");
        expect(callArgs).toContain("Macro distribution: Protein: 25%, Fats: 30%, Carbohydrates: 45%");
      });

      it("should handle preferences with minimal data", async () => {
        // Arrange
        const minimalPreferences: PreferencesDTO = {
          id: 1,
          userId: mockUserId,
          diet_type: "standard",
          daily_calorie_requirement: null,
          allergies: null,
          food_intolerances: null,
          preferred_cuisines: null,
          excluded_ingredients: null,
          macro_distribution_protein: null,
          macro_distribution_fats: null,
          macro_distribution_carbohydrates: null,
        };

        mockPreferencesService.getUserPreferences.mockResolvedValue(minimalPreferences);

        // Act
        await service.modifyRecipe(mockRecipeText, mockUserId);

        // Assert
        const callArgs = mockOpenRouterService.sendMessage.mock.calls[0][0];
        expect(callArgs).toContain("Diet type: standard");
        expect(callArgs).not.toContain("Target daily calories:");
        expect(callArgs).not.toContain("Allergies:");
        expect(callArgs).not.toContain("Food intolerances:");
      });

      it("should handle partial macro distribution", async () => {
        // Arrange
        const partialMacroPreferences: PreferencesDTO = {
          ...mockPreferences,
          macro_distribution_protein: 30,
          macro_distribution_fats: null,
          macro_distribution_carbohydrates: 50,
        };

        mockPreferencesService.getUserPreferences.mockResolvedValue(partialMacroPreferences);

        // Act
        await service.modifyRecipe(mockRecipeText, mockUserId);

        // Assert
        const callArgs = mockOpenRouterService.sendMessage.mock.calls[0][0];
        expect(callArgs).toContain("Macro distribution: Protein: 30%, Carbohydrates: 50%");
        expect(callArgs).not.toContain("Fats:");
      });
    });

    // ==========================================
    // TESTY WALIDACJI WEJŚCIA
    // ==========================================
    describe("input validation", () => {
      beforeEach(() => {
        mockPreferencesService.getUserPreferences.mockResolvedValue(mockPreferences);
      });

      it("should reject empty recipe text", async () => {
        // Act & Assert
        await expect(service.modifyRecipe("", mockUserId)).rejects.toThrow("Recipe text cannot be empty");
      });

      it("should reject recipe text with only whitespace", async () => {
        // Act & Assert
        await expect(service.modifyRecipe("   \n\t  ", mockUserId)).rejects.toThrow("Recipe text cannot be empty");
      });

      it("should reject recipe text that is too long", async () => {
        // Arrange
        const longRecipeText = "x".repeat(8001);

        // Act & Assert
        await expect(service.modifyRecipe(longRecipeText, mockUserId)).rejects.toThrow(
          "Recipe text is too long. Maximum 8000 characters allowed."
        );
      });

      it("should accept recipe text at maximum length", async () => {
        // Arrange
        const maxLengthRecipeText = "x".repeat(8000);
        mockOpenRouterService.sendMessage.mockResolvedValue({ reply: mockModifiedRecipe });

        // Act & Assert
        await expect(service.modifyRecipe(maxLengthRecipeText, mockUserId)).resolves.toBe(mockModifiedRecipe);
      });
    });

    // ==========================================
    // TESTY OBSŁUGI BŁĘDÓW - BRAK PREFERENCJI
    // ==========================================
    describe("user preferences validation", () => {
      it("should reject when user preferences are not found", async () => {
        // Arrange
        mockPreferencesService.getUserPreferences.mockResolvedValue(null);

        // Act & Assert
        await expect(service.modifyRecipe(mockRecipeText, mockUserId)).rejects.toThrow(
          "User preferences not found. Please set your dietary preferences first."
        );

        // Verify error logging
        expect(mockSupabase.from).toHaveBeenCalledWith("recipe_modification_errors");
      });

      it("should handle preferences service errors", async () => {
        // Arrange
        const preferencesError = new Error("Database connection failed");
        mockPreferencesService.getUserPreferences.mockRejectedValue(preferencesError);

        // Act & Assert
        await expect(service.modifyRecipe(mockRecipeText, mockUserId)).rejects.toThrow("Database connection failed");
      });
    });

    // ==========================================
    // TESTY OBSŁUGI BŁĘDÓW - PROBLEMY Z AI
    // ==========================================
    describe("AI service error handling", () => {
      beforeEach(() => {
        mockPreferencesService.getUserPreferences.mockResolvedValue(mockPreferences);
      });

      it("should handle AI service errors", async () => {
        // Arrange
        const aiError = new Error("AI service unavailable");
        mockOpenRouterService.sendMessage.mockRejectedValue(aiError);

        // Act & Assert
        await expect(service.modifyRecipe(mockRecipeText, mockUserId)).rejects.toThrow("AI service unavailable");

        // Verify error logging
        expect(mockSupabase.from).toHaveBeenCalledWith("recipe_modification_errors");
      });

      it("should handle empty AI response", async () => {
        // Arrange
        mockOpenRouterService.sendMessage.mockResolvedValue({ reply: "" });

        // Act & Assert
        await expect(service.modifyRecipe(mockRecipeText, mockUserId)).rejects.toThrow(
          "AI service returned empty response"
        );
      });

      it("should handle AI response with only whitespace", async () => {
        // Arrange
        mockOpenRouterService.sendMessage.mockResolvedValue({ reply: "   \n\t  " });

        // Act & Assert
        await expect(service.modifyRecipe(mockRecipeText, mockUserId)).rejects.toThrow(
          "AI service returned empty response"
        );
      });

      it("should handle rate limiting errors", async () => {
        // Arrange
        const rateLimitError = new Error("Rate limit exceeded");
        mockOpenRouterService.sendMessage.mockRejectedValue(rateLimitError);

        // Act & Assert
        await expect(service.modifyRecipe(mockRecipeText, mockUserId)).rejects.toThrow("Rate limit exceeded");
      });

      it("should handle authentication errors", async () => {
        // Arrange
        const authError = new Error("Invalid API key");
        mockOpenRouterService.sendMessage.mockRejectedValue(authError);

        // Act & Assert
        await expect(service.modifyRecipe(mockRecipeText, mockUserId)).rejects.toThrow("Invalid API key");
      });
    });

    // ==========================================
    // TESTY LOGOWANIA BŁĘDÓW
    // ==========================================
    describe("error logging", () => {
      it("should log error with correct data structure", async () => {
        // Arrange
        mockPreferencesService.getUserPreferences.mockResolvedValue(null);

        // Act
        try {
          await service.modifyRecipe(mockRecipeText, mockUserId);
        } catch {
          // Expected to throw
        }

        // Assert
        expect(mockSupabase.from).toHaveBeenCalledWith("recipe_modification_errors");
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            recipe_text: expect.stringContaining("Spaghetti Carbonara"),
            error_code: 422,
            error_description: "User preferences not found. Please set your dietary preferences first.",
            ai_model: "gpt-4o-mini",
            timestamp: expect.any(String),
          })
        );
      });

      it("should truncate long recipe text in error logs", async () => {
        // Arrange
        const longRecipeText = "x".repeat(2000);
        mockPreferencesService.getUserPreferences.mockResolvedValue(null);

        try {
          await service.modifyRecipe(longRecipeText, mockUserId);
        } catch {
          // Expected to throw
        }

        // Assert
        const loggedData = mockQueryBuilder.insert.mock.calls[0][0] as unknown as RecipeModificationErrorCommand & {
          ai_model: string;
          timestamp: string;
        };
        expect(loggedData.recipe_text).toHaveLength(1000);
        expect(loggedData.recipe_text).toBe("x".repeat(1000));
      });

      it("should handle error logging failures gracefully", async () => {
        // Arrange
        mockPreferencesService.getUserPreferences.mockResolvedValue(null);
        mockQueryBuilder.insert.mockRejectedValue(new Error("Database error"));

        // Act & Assert - Should not throw additional error
        await expect(service.modifyRecipe(mockRecipeText, mockUserId)).rejects.toThrow("User preferences not found");
      });

      it("should assign correct error codes", async () => {
        const testCases = [
          {
            error: new Error("User preferences not found"),
            expectedCode: 422,
            description: "Unprocessable Entity for missing preferences",
          },
          {
            error: new Error("Recipe text cannot be empty"),
            expectedCode: 400,
            description: "Bad Request for validation errors",
          },
          {
            error: new Error("Invalid API key"),
            expectedCode: 401,
            description: "Unauthorized for authentication errors",
          },
          {
            error: new Error("Rate limit exceeded"),
            expectedCode: 429,
            description: "Too Many Requests for rate limiting",
          },
          {
            error: new Error("Unknown error"),
            expectedCode: 500,
            description: "Internal Server Error for unknown errors",
          },
        ];

        for (const testCase of testCases) {
          // Reset mocks
          vi.clearAllMocks();
          mockPreferencesService.getUserPreferences.mockRejectedValue(testCase.error);

          try {
            await service.modifyRecipe(mockRecipeText, mockUserId);
          } catch {
            // Expected to throw
          }

          // Assert
          const loggedData = mockQueryBuilder.insert.mock.calls[0][0] as unknown as RecipeModificationErrorCommand & {
            ai_model: string;
            timestamp: string;
          };
          expect(loggedData.error_code).toBe(testCase.expectedCode);
        }
      });
    });

    // ==========================================
    // TESTY KONFIGURACJI I INICJALIZACJI
    // ==========================================
    describe("service initialization", () => {
      it("should initialize with correct OpenRouter configuration", () => {
        // Assert
        expect(OpenRouterService).toHaveBeenCalledWith({
          defaultModel: "gpt-4o-mini",
          modelParams: {
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 0.9,
            frequency_penalty: 0.1,
            presence_penalty: 0.1,
          },
        });
      });

      it("should set correct system message", () => {
        // Assert
        expect(mockOpenRouterService.setSystemMessage).toHaveBeenCalledWith(
          expect.stringContaining("professional nutritionist and chef assistant")
        );
      });
    });

    // ==========================================
    // TESTY INTEGRACYJNE
    // ==========================================
    describe("integration scenarios", () => {
      it("should handle complete successful workflow", async () => {
        // Arrange
        mockPreferencesService.getUserPreferences.mockResolvedValue(mockPreferences);
        mockOpenRouterService.sendMessage.mockResolvedValue({ reply: mockModifiedRecipe });

        // Act
        const result = await service.modifyRecipe(mockRecipeText, mockUserId);

        // Assert - Verify complete workflow
        expect(mockPreferencesService.getUserPreferences).toHaveBeenCalledWith(mockUserId);
        expect(mockOpenRouterService.sendMessage).toHaveBeenCalledWith(
          expect.stringContaining("ORIGINAL RECIPE:"),
          expect.objectContaining({
            temperature: 0.7,
            max_tokens: 2000,
          })
        );
        expect(result).toBe(mockModifiedRecipe);
        expect(mockSupabase.from).not.toHaveBeenCalled(); // No error logging
      });

      it("should handle complex recipe with multiple dietary restrictions", async () => {
        // Arrange
        const complexPreferences: PreferencesDTO = {
          ...mockPreferences,
          diet_type: "vegan",
          allergies: "nuts, shellfish, eggs",
          food_intolerances: "lactose, gluten",
          excluded_ingredients: "meat, dairy, wheat",
        };

        mockPreferencesService.getUserPreferences.mockResolvedValue(complexPreferences);
        mockOpenRouterService.sendMessage.mockResolvedValue({ reply: mockModifiedRecipe });

        // Act
        await service.modifyRecipe(mockRecipeText, mockUserId);

        // Assert
        const callArgs = mockOpenRouterService.sendMessage.mock.calls[0][0];
        expect(callArgs).toContain("Diet type: vegan");
        expect(callArgs).toContain("Allergies: nuts, shellfish, eggs");
        expect(callArgs).toContain("Food intolerances: lactose, gluten");
        expect(callArgs).toContain("Ingredients to avoid: meat, dairy, wheat");
      });
    });
  });
});
