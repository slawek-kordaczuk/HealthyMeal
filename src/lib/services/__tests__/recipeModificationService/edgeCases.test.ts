import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { RecipeModificationService } from "../../recipeModificationService";
import { PreferencesService } from "../../preferencesService";
import { OpenRouterService } from "../../OpenRouterService";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PreferencesDTO } from "../../../../types/types";
import {
  TEST_USER_ID,
  EDGE_CASE_RECIPES,
  VEGETARIAN_PREFERENCES,
  VEGAN_PREFERENCES,
  KETO_PREFERENCES,
  COMPLEX_ALLERGIES_PREFERENCES,
  MODIFIED_VEGETARIAN_RECIPE,
  ERROR_SCENARIOS,
  EXPECTED_ERROR_CODES,
} from "./fixtures";

// Mock types (reused from main test file)
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

describe("RecipeModificationService - Edge Cases", () => {
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

  describe("Recipe text edge cases", () => {
    beforeEach(() => {
      mockPreferencesService.getUserPreferences.mockResolvedValue(VEGETARIAN_PREFERENCES);
      mockOpenRouterService.sendMessage.mockResolvedValue({ reply: MODIFIED_VEGETARIAN_RECIPE });
    });

    it("should handle very short recipes", async () => {
      // Act
      const result = await service.modifyRecipe(EDGE_CASE_RECIPES.VERY_SHORT, TEST_USER_ID);

      // Assert
      expect(result).toBe(MODIFIED_VEGETARIAN_RECIPE);
      expect(mockOpenRouterService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining(EDGE_CASE_RECIPES.VERY_SHORT),
        expect.any(Object)
      );
    });

    it("should handle recipes with special characters and emojis", async () => {
      // Act
      const result = await service.modifyRecipe(EDGE_CASE_RECIPES.WITH_SPECIAL_CHARS, TEST_USER_ID);

      // Assert
      expect(result).toBe(MODIFIED_VEGETARIAN_RECIPE);
      expect(mockOpenRouterService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining("émojis 🍝"),
        expect.any(Object)
      );
    });

    it("should handle recipes at maximum allowed length", async () => {
      // Arrange
      const maxLengthRecipe = "Recipe: " + "ingredient, ".repeat(1000);
      const truncatedRecipe = maxLengthRecipe.substring(0, 8000);

      // Act
      const result = await service.modifyRecipe(truncatedRecipe, TEST_USER_ID);

      // Assert
      expect(result).toBe(MODIFIED_VEGETARIAN_RECIPE);
      expect(mockOpenRouterService.sendMessage).toHaveBeenCalled();
    });

    it("should reject recipes that exceed maximum length", async () => {
      // Arrange
      const tooLongRecipe = "x".repeat(8001);

      // Act & Assert
      await expect(service.modifyRecipe(tooLongRecipe, TEST_USER_ID)).rejects.toThrow(ERROR_SCENARIOS.TOO_LONG_RECIPE);
    });

    it("should handle recipes with only whitespace", async () => {
      // Act & Assert
      await expect(service.modifyRecipe(EDGE_CASE_RECIPES.ONLY_WHITESPACE, TEST_USER_ID)).rejects.toThrow(
        ERROR_SCENARIOS.EMPTY_RECIPE
      );
    });

    it("should handle empty recipe strings", async () => {
      // Act & Assert
      await expect(service.modifyRecipe(EDGE_CASE_RECIPES.EMPTY, TEST_USER_ID)).rejects.toThrow(
        ERROR_SCENARIOS.EMPTY_RECIPE
      );
    });
  });

  describe("Complex dietary preferences scenarios", () => {
    beforeEach(() => {
      mockOpenRouterService.sendMessage.mockResolvedValue({ reply: MODIFIED_VEGETARIAN_RECIPE });
    });

    it("should handle vegan preferences with multiple restrictions", async () => {
      // Arrange
      mockPreferencesService.getUserPreferences.mockResolvedValue(VEGAN_PREFERENCES);

      // Act
      await service.modifyRecipe(EDGE_CASE_RECIPES.VERY_SHORT, TEST_USER_ID);

      // Assert
      const callArgs = mockOpenRouterService.sendMessage.mock.calls[0][0];
      expect(callArgs).toContain("Diet type: vegan");
      expect(callArgs).toContain("Allergies: soy, nuts");
      expect(callArgs).toContain("Ingredients to avoid: meat, dairy, eggs, honey");
      expect(callArgs).toContain("Target daily calories: 1800");
    });

    it("should handle ketogenic diet with high fat requirements", async () => {
      // Arrange
      mockPreferencesService.getUserPreferences.mockResolvedValue(KETO_PREFERENCES);

      // Act
      await service.modifyRecipe(EDGE_CASE_RECIPES.VERY_SHORT, TEST_USER_ID);

      // Assert
      const callArgs = mockOpenRouterService.sendMessage.mock.calls[0][0];
      expect(callArgs).toContain("Diet type: ketogenic");
      expect(callArgs).toContain("Food intolerances: gluten");
      expect(callArgs).toContain("Macro distribution: Protein: 25%, Fats: 70%, Carbohydrates: 5%");
      expect(callArgs).toContain("Ingredients to avoid: grains, sugar, potatoes");
    });

    it("should handle complex allergy restrictions", async () => {
      // Arrange
      mockPreferencesService.getUserPreferences.mockResolvedValue(COMPLEX_ALLERGIES_PREFERENCES);

      // Act
      await service.modifyRecipe(EDGE_CASE_RECIPES.VERY_SHORT, TEST_USER_ID);

      // Assert
      const callArgs = mockOpenRouterService.sendMessage.mock.calls[0][0];
      expect(callArgs).toContain("Diet type: gluten-free");
      expect(callArgs).toContain("Allergies: shellfish, tree nuts, peanuts, eggs");
      expect(callArgs).toContain("Food intolerances: lactose, fructose");
      expect(callArgs).toContain("Preferred cuisines: Thai, Indian, Mexican");
      expect(callArgs).toContain("Ingredients to avoid: wheat, barley, rye, oats");
    });
  });

  describe("AI response edge cases", () => {
    beforeEach(() => {
      mockPreferencesService.getUserPreferences.mockResolvedValue(VEGETARIAN_PREFERENCES);
    });

    it("should handle AI response with extra whitespace", async () => {
      // Arrange
      const responseWithWhitespace = `\n\n  ${MODIFIED_VEGETARIAN_RECIPE}  \n\n`;
      mockOpenRouterService.sendMessage.mockResolvedValue({ reply: responseWithWhitespace });

      // Act
      const result = await service.modifyRecipe(EDGE_CASE_RECIPES.VERY_SHORT, TEST_USER_ID);

      // Assert
      expect(result).toBe(responseWithWhitespace); // Should return as-is without trimming
    });

    it("should handle very long AI responses", async () => {
      // Arrange
      const longResponse = MODIFIED_VEGETARIAN_RECIPE + "\n" + "Additional notes: ".repeat(500);
      mockOpenRouterService.sendMessage.mockResolvedValue({ reply: longResponse });

      // Act
      const result = await service.modifyRecipe(EDGE_CASE_RECIPES.VERY_SHORT, TEST_USER_ID);

      // Assert
      expect(result).toBe(longResponse);
      expect(result.length).toBeGreaterThan(1000);
    });

    it("should handle AI responses with special characters", async () => {
      // Arrange
      const specialCharResponse = "Modified recipe with émojis 🍕 and symbols: ±∞§¶•";
      mockOpenRouterService.sendMessage.mockResolvedValue({ reply: specialCharResponse });

      // Act
      const result = await service.modifyRecipe(EDGE_CASE_RECIPES.VERY_SHORT, TEST_USER_ID);

      // Assert
      expect(result).toBe(specialCharResponse);
    });
  });

  describe("Concurrent modifications", () => {
    beforeEach(() => {
      mockPreferencesService.getUserPreferences.mockResolvedValue(VEGETARIAN_PREFERENCES);
      mockOpenRouterService.sendMessage.mockResolvedValue({ reply: MODIFIED_VEGETARIAN_RECIPE });
    });

    it("should handle multiple simultaneous modification requests", async () => {
      // Arrange
      const recipes = [EDGE_CASE_RECIPES.VERY_SHORT, EDGE_CASE_RECIPES.WITH_SPECIAL_CHARS, "Simple pasta recipe"];

      // Act
      const promises = recipes.map((recipe) => service.modifyRecipe(recipe, TEST_USER_ID));
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBe(MODIFIED_VEGETARIAN_RECIPE);
      });
      expect(mockPreferencesService.getUserPreferences).toHaveBeenCalledTimes(3);
      expect(mockOpenRouterService.sendMessage).toHaveBeenCalledTimes(3);
    });
  });

  describe("Database error handling", () => {
    beforeEach(() => {
      mockPreferencesService.getUserPreferences.mockResolvedValue(VEGETARIAN_PREFERENCES);
    });

    it("should handle database errors during error logging", async () => {
      // Arrange
      mockOpenRouterService.sendMessage.mockRejectedValue(new Error(ERROR_SCENARIOS.AI_SERVICE_ERROR));
      mockQueryBuilder.insert.mockRejectedValue(new Error("Database connection lost"));

      // Act & Assert
      await expect(service.modifyRecipe(EDGE_CASE_RECIPES.VERY_SHORT, TEST_USER_ID)).rejects.toThrow(
        ERROR_SCENARIOS.AI_SERVICE_ERROR
      );

      // Should still attempt to log the error despite database failure
      expect(mockSupabase.from).toHaveBeenCalledWith("recipe_modification_errors");
    });

    it("should handle Supabase client returning null error", async () => {
      // Arrange
      mockOpenRouterService.sendMessage.mockRejectedValue(new Error(ERROR_SCENARIOS.AI_SERVICE_ERROR));
      mockQueryBuilder.insert.mockResolvedValue({ error: null });

      // Act & Assert
      await expect(service.modifyRecipe(EDGE_CASE_RECIPES.VERY_SHORT, TEST_USER_ID)).rejects.toThrow(
        ERROR_SCENARIOS.AI_SERVICE_ERROR
      );

      // Should successfully log the error
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          error_code: EXPECTED_ERROR_CODES.INTERNAL_SERVER_ERROR,
          error_description: ERROR_SCENARIOS.AI_SERVICE_ERROR,
        })
      );
    });
  });

  describe("Memory and performance edge cases", () => {
    beforeEach(() => {
      mockPreferencesService.getUserPreferences.mockResolvedValue(VEGETARIAN_PREFERENCES);
      mockOpenRouterService.sendMessage.mockResolvedValue({ reply: MODIFIED_VEGETARIAN_RECIPE });
    });

    it("should handle recipes with repeated content", async () => {
      // Arrange
      const repeatedContent = "Boil water. Add pasta. ".repeat(200); // ~4000 chars

      // Act
      const result = await service.modifyRecipe(repeatedContent, TEST_USER_ID);

      // Assert
      expect(result).toBe(MODIFIED_VEGETARIAN_RECIPE);
      expect(mockOpenRouterService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining(repeatedContent),
        expect.any(Object)
      );
    });

    it("should handle Unicode characters and emojis correctly", async () => {
      // Arrange
      const unicodeRecipe = "Recipe with 中文, العربية, 🍜🍝🍲 and ñoñó ingredients";

      // Act
      const result = await service.modifyRecipe(unicodeRecipe, TEST_USER_ID);

      // Assert
      expect(result).toBe(MODIFIED_VEGETARIAN_RECIPE);
      expect(mockOpenRouterService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining("中文"),
        expect.any(Object)
      );
    });
  });

  describe("Service dependency failures", () => {
    it("should handle PreferencesService constructor failure", () => {
      // Arrange
      vi.mocked(PreferencesService).mockImplementation(() => {
        throw new Error("PreferencesService initialization failed");
      });

      // Act & Assert
      expect(() => {
        new RecipeModificationService(mockSupabase as unknown as SupabaseClient);
      }).toThrow("PreferencesService initialization failed");
    });

    it("should handle OpenRouterService constructor failure", () => {
      // Arrange
      vi.mocked(OpenRouterService).mockImplementation(() => {
        throw new Error("OpenRouterService initialization failed");
      });

      // Act & Assert
      expect(() => {
        new RecipeModificationService(mockSupabase as unknown as SupabaseClient);
      }).toThrow("OpenRouterService initialization failed");
    });
  });
});
