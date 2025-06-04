import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RecipeService, RecipeNotFoundError, UnauthorizedError } from "../../recipeService";
import type { SupabaseClient } from "../../../../db/supabase.client";
import {
  mockUserId,
  mockExistingDbRecipe,
  createMockSupabase,
  mockDatabaseError,
  createMockResponse,
} from "./shared-mocks";

describe("RecipeService - deleteRecipe", () => {
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
    it("should successfully delete recipe and all associated data", async () => {
      // Arrange
      const recipeId = 1;

      // Mock the fetch existing recipe query
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(mockExistingDbRecipe)),
      };

      // Mock deletion queries
      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteStatisticsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteRecipeQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery) // Fetch existing recipe
        .mockReturnValueOnce(mockDeleteModificationsQuery) // Delete modifications
        .mockReturnValueOnce(mockDeleteStatisticsQuery) // Delete statistics
        .mockReturnValueOnce(mockDeleteRecipeQuery); // Delete recipe

      // Act
      await recipeService.deleteRecipe(recipeId, mockUserId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledTimes(4);
      expect(mockSupabase.from).toHaveBeenNthCalledWith(1, "recipes");
      expect(mockSupabase.from).toHaveBeenNthCalledWith(2, "recipe_modifications");
      expect(mockSupabase.from).toHaveBeenNthCalledWith(3, "recipe_statistics");
      expect(mockSupabase.from).toHaveBeenNthCalledWith(4, "recipes");

      // Verify fetch recipe
      expect(mockSelectQuery.select).toHaveBeenCalledWith("*");
      expect(mockSelectQuery.eq).toHaveBeenCalledWith("id", recipeId);

      // Verify deletions in correct order
      expect(mockDeleteModificationsQuery.delete).toHaveBeenCalled();
      expect(mockDeleteModificationsQuery.eq).toHaveBeenCalledWith("recipe_id", recipeId);

      expect(mockDeleteStatisticsQuery.delete).toHaveBeenCalled();
      expect(mockDeleteStatisticsQuery.eq).toHaveBeenCalledWith("recipe_id", recipeId);

      expect(mockDeleteRecipeQuery.delete).toHaveBeenCalled();
      expect(mockDeleteRecipeQuery.eq).toHaveBeenCalledWith("id", recipeId);
    });

    it("should handle recipe with no associated modifications or statistics", async () => {
      // Arrange
      const recipeId = 5;

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(mockExistingDbRecipe)),
      };

      // Mock empty deletions (no associated data)
      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteStatisticsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteRecipeQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery)
        .mockReturnValueOnce(mockDeleteStatisticsQuery)
        .mockReturnValueOnce(mockDeleteRecipeQuery);

      // Act
      await recipeService.deleteRecipe(recipeId, mockUserId);

      // Assert - Should complete successfully even with no associated data
      expect(mockDeleteModificationsQuery.eq).toHaveBeenCalledWith("recipe_id", recipeId);
      expect(mockDeleteStatisticsQuery.eq).toHaveBeenCalledWith("recipe_id", recipeId);
      expect(mockDeleteRecipeQuery.eq).toHaveBeenCalledWith("id", recipeId);
    });

    it("should delete recipe created by AI source", async () => {
      // Arrange
      const aiRecipe = {
        ...mockExistingDbRecipe,
        source: "AI",
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(aiRecipe)),
      };

      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteStatisticsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteRecipeQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery)
        .mockReturnValueOnce(mockDeleteStatisticsQuery)
        .mockReturnValueOnce(mockDeleteRecipeQuery);

      // Act
      await recipeService.deleteRecipe(1, mockUserId);

      // Assert - Should handle AI recipes the same way
      expect(mockDeleteRecipeQuery.delete).toHaveBeenCalled();
    });
  });

  describe("Business Rules", () => {
    it("should only allow user to delete their own recipes", async () => {
      // Arrange
      const recipeId = 1;
      const differentUserId = "different_user";

      // Mock recipe with different user_id
      const unauthorizedRecipe = {
        ...mockExistingDbRecipe,
        user_id: differentUserId,
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(unauthorizedRecipe)),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockSelectQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(recipeId, mockUserId)).rejects.toThrow(UnauthorizedError);

      // Verify that no deletion queries were made
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Only fetch query
    });

    it("should verify recipe ownership before deletion", async () => {
      // Arrange
      const recipeId = 1;
      const specificUserId = "user456";

      // Mock recipe with specific user_id
      const ownedRecipe = {
        ...mockExistingDbRecipe,
        user_id: specificUserId,
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(ownedRecipe)),
      };

      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteStatisticsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteRecipeQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery)
        .mockReturnValueOnce(mockDeleteStatisticsQuery)
        .mockReturnValueOnce(mockDeleteRecipeQuery);

      // Act
      await recipeService.deleteRecipe(recipeId, specificUserId);

      // Assert - Should allow deletion for correct owner
      expect(mockSelectQuery.eq).toHaveBeenCalledWith("id", recipeId);
      expect(mockDeleteRecipeQuery.delete).toHaveBeenCalled();
    });

    it("should delete associated data in correct order (foreign key constraints)", async () => {
      // Arrange
      const recipeId = 1;

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(mockExistingDbRecipe)),
      };

      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteStatisticsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteRecipeQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery)
        .mockReturnValueOnce(mockDeleteStatisticsQuery)
        .mockReturnValueOnce(mockDeleteRecipeQuery);

      // Act
      await recipeService.deleteRecipe(recipeId, mockUserId);

      // Assert - Verify correct order: modifications first, then statistics, then recipe
      expect(mockSupabase.from).toHaveBeenNthCalledWith(2, "recipe_modifications"); // First deletion
      expect(mockSupabase.from).toHaveBeenNthCalledWith(3, "recipe_statistics"); // Second deletion
      expect(mockSupabase.from).toHaveBeenNthCalledWith(4, "recipes"); // Last deletion
    });

    it("should handle empty user ID", async () => {
      // Arrange
      const recipeId = 1;
      const emptyUserId = "";

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(mockExistingDbRecipe)),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockSelectQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(recipeId, emptyUserId)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("Edge Cases", () => {
    it("should throw RecipeNotFoundError when recipe does not exist", async () => {
      // Arrange
      const nonExistentRecipeId = 999;

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      mockSupabase.from = vi.fn().mockReturnValue(mockSelectQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(nonExistentRecipeId, mockUserId)).rejects.toThrow(RecipeNotFoundError);

      // Verify no deletion queries were made
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    it("should throw RecipeNotFoundError when fetch query returns error", async () => {
      // Arrange
      const recipeId = 1;

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(null, mockDatabaseError)),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockSelectQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(recipeId, mockUserId)).rejects.toThrow(RecipeNotFoundError);
    });

    it("should handle invalid recipe ID", async () => {
      // Arrange
      const invalidRecipeId = -1;

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockSelectQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(invalidRecipeId, mockUserId)).rejects.toThrow(RecipeNotFoundError);
    });

    it("should handle zero recipe ID", async () => {
      // Arrange
      const zeroRecipeId = 0;

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockSelectQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(zeroRecipeId, mockUserId)).rejects.toThrow(RecipeNotFoundError);
    });

    it("should handle recipe with complex JSON data", async () => {
      // Arrange
      const complexRecipe = {
        ...mockExistingDbRecipe,
        recipe: {
          ingredients: [
            { name: "chicken", amount: "500g", category: "protein" },
            { name: "spices", amount: "2tsp", category: "seasoning" },
          ],
          instructions: [
            { step: 1, description: "Prepare ingredients" },
            { step: 2, description: "Cook chicken" },
          ],
          metadata: {
            cookTime: 30,
            difficulty: "medium",
            cuisine: "Asian",
          },
        },
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(complexRecipe)),
      };

      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteStatisticsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteRecipeQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery)
        .mockReturnValueOnce(mockDeleteStatisticsQuery)
        .mockReturnValueOnce(mockDeleteRecipeQuery);

      // Act
      await recipeService.deleteRecipe(1, mockUserId);

      // Assert - Should handle complex JSON structure without issues
      expect(mockDeleteRecipeQuery.delete).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should throw error when modification deletion fails", async () => {
      // Arrange
      const recipeId = 1;

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(mockExistingDbRecipe)),
      };

      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null, mockDatabaseError)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(recipeId, mockUserId)).rejects.toThrow(
        "Failed to delete recipe modifications"
      );

      // Verify that subsequent deletions were not attempted
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });

    it("should throw error when statistics deletion fails", async () => {
      // Arrange
      const recipeId = 1;

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(mockExistingDbRecipe)),
      };

      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteStatisticsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null, mockDatabaseError)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery)
        .mockReturnValueOnce(mockDeleteStatisticsQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(recipeId, mockUserId)).rejects.toThrow(
        "Failed to delete recipe statistics"
      );

      // Verify that recipe deletion was not attempted
      expect(mockSupabase.from).toHaveBeenCalledTimes(3);
    });

    it("should throw error when recipe deletion fails", async () => {
      // Arrange
      const recipeId = 1;

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(mockExistingDbRecipe)),
      };

      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteStatisticsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteRecipeQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null, mockDatabaseError)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery)
        .mockReturnValueOnce(mockDeleteStatisticsQuery)
        .mockReturnValueOnce(mockDeleteRecipeQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(recipeId, mockUserId)).rejects.toThrow("Failed to delete recipe");
    });

    it("should handle database connection timeout", async () => {
      // Arrange
      const recipeId = 1;
      const timeoutError = new Error("Connection timeout");

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(timeoutError),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockSelectQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(recipeId, mockUserId)).rejects.toThrow("Connection timeout");
    });

    it("should handle query chain failure", async () => {
      // Arrange
      const recipeId = 1;
      const queryError = new Error("Query execution failed");

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(mockExistingDbRecipe)),
      };

      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockRejectedValue(queryError),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(recipeId, mockUserId)).rejects.toThrow("Query execution failed");
    });

    it("should handle foreign key constraint errors gracefully", async () => {
      // Arrange
      const recipeId = 1;
      const constraintError = {
        message: "Foreign key constraint violation",
        code: "23503",
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(mockExistingDbRecipe)),
      };

      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null, constraintError)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(recipeId, mockUserId)).rejects.toThrow(
        "Failed to delete recipe modifications"
      );
    });
  });

  describe("Integration Tests - Database Interactions", () => {
    it("should call Supabase methods in correct sequence", async () => {
      // Arrange
      const recipeId = 1;

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(mockExistingDbRecipe)),
      };

      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteStatisticsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteRecipeQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery)
        .mockReturnValueOnce(mockDeleteStatisticsQuery)
        .mockReturnValueOnce(mockDeleteRecipeQuery);

      // Act
      await recipeService.deleteRecipe(recipeId, mockUserId);

      // Assert - Verify complete interaction sequence
      expect(mockSupabase.from).toHaveBeenCalledTimes(4);

      // Verify fetch sequence
      expect(mockSelectQuery.select).toHaveBeenCalledWith("*");
      expect(mockSelectQuery.eq).toHaveBeenCalledWith("id", recipeId);
      expect(mockSelectQuery.single).toHaveBeenCalled();

      // Verify deletion sequence
      expect(mockDeleteModificationsQuery.delete).toHaveBeenCalled();
      expect(mockDeleteModificationsQuery.eq).toHaveBeenCalledWith("recipe_id", recipeId);

      expect(mockDeleteStatisticsQuery.delete).toHaveBeenCalled();
      expect(mockDeleteStatisticsQuery.eq).toHaveBeenCalledWith("recipe_id", recipeId);

      expect(mockDeleteRecipeQuery.delete).toHaveBeenCalled();
      expect(mockDeleteRecipeQuery.eq).toHaveBeenCalledWith("id", recipeId);
    });

    it("should handle transaction-like behavior (all or nothing)", async () => {
      // Arrange - Simulate failure in the middle of deletion process
      const recipeId = 1;

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(mockExistingDbRecipe)),
      };

      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      // Statistics deletion fails
      const mockDeleteStatisticsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null, mockDatabaseError)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery)
        .mockReturnValueOnce(mockDeleteStatisticsQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(recipeId, mockUserId)).rejects.toThrow(
        "Failed to delete recipe statistics"
      );

      // Verify that modifications were deleted but recipe deletion was not attempted
      expect(mockDeleteModificationsQuery.delete).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledTimes(3); // No recipe deletion call
    });

    it("should handle concurrent deletion attempts", async () => {
      // Arrange - Simulate recipe already deleted by another process
      const recipeId = 1;

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(mockExistingDbRecipe)),
      };

      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteStatisticsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      // Recipe no longer exists when we try to delete it
      const concurrencyError = {
        message: "Record not found",
        code: "PGRST116",
      };

      const mockDeleteRecipeQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null, concurrencyError)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery)
        .mockReturnValueOnce(mockDeleteStatisticsQuery)
        .mockReturnValueOnce(mockDeleteRecipeQuery);

      // Act & Assert
      await expect(recipeService.deleteRecipe(recipeId, mockUserId)).rejects.toThrow("Failed to delete recipe");
    });

    it("should handle deletion of recipe with extensive modification history", async () => {
      // Arrange - Recipe with lots of associated data
      const recipeId = 1;

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(createMockResponse(mockExistingDbRecipe)),
      };

      // Mock successful deletion of extensive data
      const mockDeleteModificationsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteStatisticsQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      const mockDeleteRecipeQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(createMockResponse(null)),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockDeleteModificationsQuery)
        .mockReturnValueOnce(mockDeleteStatisticsQuery)
        .mockReturnValueOnce(mockDeleteRecipeQuery);

      // Act
      await recipeService.deleteRecipe(recipeId, mockUserId);

      // Assert - Should handle large datasets efficiently
      expect(mockDeleteModificationsQuery.eq).toHaveBeenCalledWith("recipe_id", recipeId);
      expect(mockDeleteStatisticsQuery.eq).toHaveBeenCalledWith("recipe_id", recipeId);
      expect(mockDeleteRecipeQuery.eq).toHaveBeenCalledWith("id", recipeId);
    });
  });
});
