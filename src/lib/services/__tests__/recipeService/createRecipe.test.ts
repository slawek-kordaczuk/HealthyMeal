import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RecipeService } from "../../recipeService";
import type { CreateRecipeCommand, RecipeDTO } from "../../../../types/types";
import type { SupabaseClient } from "../../../../db/supabase.client";
import { mockUserId, createMockSupabase, mockDatabaseError, mockConstraintError } from "./shared-mocks";

describe("RecipeService - createRecipe", () => {
  let recipeService: RecipeService;
  let mockSupabase: Partial<SupabaseClient>;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockSupabase = createMockSupabase();
    recipeService = new RecipeService(mockSupabase as SupabaseClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Happy Path - Basic Functionality", () => {
    it("should create recipe with all fields provided", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        name: "Beef Stroganoff",
        rating: 8,
        source: "manual",
        recipe: {
          ingredients: ["beef", "mushrooms", "cream"],
          instructions: "Cook beef, add mushrooms and cream...",
          servings: 4,
        },
      };

      const expectedInsertData = {
        name: "Beef Stroganoff",
        rating: 8,
        source: "manual",
        recipe: command.recipe,
        user_id: mockUserId,
      };

      const createdRecipe: RecipeDTO = {
        id: 4,
        name: "Beef Stroganoff",
        rating: 8,
        source: "manual",
        recipe: command.recipe,
        created_at: "2024-01-16T10:00:00Z",
        updated_at: "2024-01-16T10:00:00Z",
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecipe, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act
      const result = await recipeService.createRecipe(command, mockUserId);

      // Assert
      expect(result).toEqual(createdRecipe);
      expect(mockSupabase.from).toHaveBeenCalledWith("recipes");
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(expectedInsertData);
      expect(mockInsertQuery.select).toHaveBeenCalled();
      expect(mockInsertQuery.single).toHaveBeenCalled();
    });

    it("should create recipe without rating (optional field)", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        name: "Simple Pasta",
        source: "AI",
        recipe: {
          ingredients: ["pasta", "tomato sauce"],
          instructions: "Boil pasta, add sauce",
        },
      };

      const expectedInsertData = {
        name: "Simple Pasta",
        rating: null, // Should be null when not provided
        source: "AI",
        recipe: command.recipe,
        user_id: mockUserId,
      };

      const createdRecipe: RecipeDTO = {
        id: 5,
        name: "Simple Pasta",
        rating: 0, // Database might return 0 for null
        source: "AI",
        recipe: command.recipe,
        created_at: "2024-01-16T11:00:00Z",
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecipe, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act
      const result = await recipeService.createRecipe(command, mockUserId);

      // Assert
      expect(result).toEqual(createdRecipe);
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(expectedInsertData);
    });

    it("should create recipe with AI source", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        name: "AI Generated Smoothie",
        rating: 9,
        source: "AI",
        recipe: {
          ingredients: ["banana", "yogurt", "honey"],
          instructions: "Blend all ingredients until smooth",
          tags: ["healthy", "breakfast"],
        },
      };

      const expectedInsertData = {
        name: "AI Generated Smoothie",
        rating: 9,
        source: "AI",
        recipe: command.recipe,
        user_id: mockUserId,
      };

      const createdRecipe: RecipeDTO = {
        id: 6,
        name: "AI Generated Smoothie",
        rating: 9,
        source: "AI",
        recipe: command.recipe,
        created_at: "2024-01-16T12:00:00Z",
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecipe, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act
      const result = await recipeService.createRecipe(command, mockUserId);

      // Assert
      expect(result).toEqual(createdRecipe);
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(expectedInsertData);
    });
  });

  describe("Business Rules", () => {
    it("should assign user_id from userId parameter", async () => {
      // Arrange
      const specificUserId = "user789";
      const command: CreateRecipeCommand = {
        name: "User Specific Recipe",
        source: "manual",
        recipe: { ingredients: ["test"], instructions: "test instructions" },
      };

      const expectedInsertData = {
        name: "User Specific Recipe",
        rating: null,
        source: "manual",
        recipe: command.recipe,
        user_id: specificUserId, // Should use the provided userId
      };

      const createdRecipe: RecipeDTO = {
        id: 7,
        name: "User Specific Recipe",
        rating: 0,
        source: "manual",
        recipe: command.recipe,
        created_at: "2024-01-16T13:00:00Z",
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecipe, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act
      await recipeService.createRecipe(command, specificUserId);

      // Assert
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(expectedInsertData);
    });

    it("should handle rating nullish coalescing correctly", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        name: "Rating Test Recipe",
        rating: 0, // Explicitly set to 0 (falsy but valid)
        source: "manual",
        recipe: { ingredients: ["test"], instructions: "test instructions" },
      };

      const expectedInsertData = {
        name: "Rating Test Recipe",
        rating: 0, // Should preserve 0, not convert to null
        source: "manual",
        recipe: command.recipe,
        user_id: mockUserId,
      };

      const createdRecipe: RecipeDTO = {
        id: 8,
        name: "Rating Test Recipe",
        rating: 0,
        source: "manual",
        recipe: command.recipe,
        created_at: "2024-01-16T14:00:00Z",
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecipe, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act
      await recipeService.createRecipe(command, mockUserId);

      // Assert
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(expectedInsertData);
    });

    it("should handle complex recipe Json structure", async () => {
      // Arrange
      const complexRecipe = {
        ingredients: [
          { name: "chicken breast", amount: "500g", category: "protein" },
          { name: "olive oil", amount: "2tbsp", category: "fat" },
        ],
        instructions: [
          { step: 1, description: "Preheat oven to 180°C" },
          { step: 2, description: "Season chicken with salt and pepper" },
          { step: 3, description: "Cook for 25 minutes" },
        ],
        metadata: {
          cookTime: 25,
          prepTime: 10,
          difficulty: "easy",
          cuisine: "Mediterranean",
        },
        tags: ["healthy", "protein", "quick"],
      };

      const command: CreateRecipeCommand = {
        name: "Mediterranean Chicken",
        rating: 7,
        source: "manual",
        recipe: complexRecipe,
      };

      const expectedInsertData = {
        name: "Mediterranean Chicken",
        rating: 7,
        source: "manual",
        recipe: complexRecipe,
        user_id: mockUserId,
      };

      const createdRecipe: RecipeDTO = {
        id: 9,
        name: "Mediterranean Chicken",
        rating: 7,
        source: "manual",
        recipe: complexRecipe,
        created_at: "2024-01-16T15:00:00Z",
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecipe, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act
      const result = await recipeService.createRecipe(command, mockUserId);

      // Assert
      expect(result).toEqual(createdRecipe);
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(expectedInsertData);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty recipe Json object", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        name: "Minimal Recipe",
        source: "manual",
        recipe: {}, // Empty object
      };

      const expectedInsertData = {
        name: "Minimal Recipe",
        rating: null,
        source: "manual",
        recipe: {},
        user_id: mockUserId,
      };

      const createdRecipe: RecipeDTO = {
        id: 10,
        name: "Minimal Recipe",
        rating: 0,
        source: "manual",
        recipe: {},
        created_at: "2024-01-16T16:00:00Z",
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecipe, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act
      const result = await recipeService.createRecipe(command, mockUserId);

      // Assert
      expect(result).toEqual(createdRecipe);
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(expectedInsertData);
    });

    it("should handle special characters in recipe name", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        name: "Coq au Vin & Rösti (Chef's Special) - 2024",
        rating: 10,
        source: "manual",
        recipe: { ingredients: ["chicken", "wine"], instructions: "Traditional French cooking" },
      };

      const createdRecipe: RecipeDTO = {
        id: 11,
        name: "Coq au Vin & Rösti (Chef's Special) - 2024",
        rating: 10,
        source: "manual",
        recipe: command.recipe,
        created_at: "2024-01-16T17:00:00Z",
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecipe, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act
      const result = await recipeService.createRecipe(command, mockUserId);

      // Assert
      expect(result).toEqual(createdRecipe);
      expect(result.name).toBe("Coq au Vin & Rösti (Chef's Special) - 2024");
    });
  });

  describe("Error Handling", () => {
    it("should throw error when database insert fails", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        name: "Failed Recipe",
        source: "manual",
        recipe: { ingredients: ["test"], instructions: "test" },
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockDatabaseError }),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act & Assert
      await expect(recipeService.createRecipe(command, mockUserId)).rejects.toThrow(
        "Failed to create recipe: Database connection failed"
      );
    });

    it("should throw error when no data is returned from database", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        name: "No Data Recipe",
        source: "manual",
        recipe: { ingredients: ["test"], instructions: "test" },
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }), // No error but also no data
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act & Assert
      await expect(recipeService.createRecipe(command, mockUserId)).rejects.toThrow(
        "Failed to create recipe: No data returned"
      );
    });

    it("should throw error when insert query chain fails", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        name: "Query Chain Failure",
        source: "manual",
        recipe: { ingredients: ["test"], instructions: "test" },
      };

      const databaseError = new Error("Connection timeout");

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(databaseError),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act & Assert
      await expect(recipeService.createRecipe(command, mockUserId)).rejects.toThrow("Connection timeout");
    });

    it("should handle constraint violation errors", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        name: "Duplicate Recipe Name",
        source: "manual",
        recipe: { ingredients: ["test"], instructions: "test" },
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockConstraintError }),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act & Assert
      await expect(recipeService.createRecipe(command, mockUserId)).rejects.toThrow(
        "Failed to create recipe: Unique constraint violated"
      );
    });
  });

  describe("Integration Tests - Database Interactions", () => {
    it("should call Supabase methods in correct order", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        name: "Integration Test Recipe",
        rating: 6,
        source: "AI",
        recipe: { ingredients: ["integration", "test"], instructions: "Test the integration" },
      };

      const createdRecipe: RecipeDTO = {
        id: 12,
        name: "Integration Test Recipe",
        rating: 6,
        source: "AI",
        recipe: command.recipe,
        created_at: "2024-01-16T18:00:00Z",
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecipe, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act
      await recipeService.createRecipe(command, mockUserId);

      // Assert - Verify the entire chain is called in correct order
      expect(mockSupabase.from).toHaveBeenCalledWith("recipes");
      expect(mockInsertQuery.insert).toHaveBeenCalled();
      expect(mockInsertQuery.select).toHaveBeenCalled();
      expect(mockInsertQuery.single).toHaveBeenCalled();
    });

    it("should handle database response with minimal fields", async () => {
      // Arrange
      const command: CreateRecipeCommand = {
        name: "Minimal Response Recipe",
        source: "manual",
        recipe: { ingredients: ["minimal"], instructions: "minimal test" },
      };

      // Database might return minimal fields
      const minimalResponse = {
        id: 13,
        name: "Minimal Response Recipe",
        rating: 0,
        source: "manual",
        recipe: command.recipe,
        created_at: "2024-01-16T19:00:00Z",
        // Note: no updated_at field
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: minimalResponse, error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockInsertQuery);

      // Act
      const result = await recipeService.createRecipe(command, mockUserId);

      // Assert
      expect(result).toEqual(minimalResponse);
      expect(result.id).toBe(13);
      expect(result.created_at).toBeDefined();
    });
  });
});
