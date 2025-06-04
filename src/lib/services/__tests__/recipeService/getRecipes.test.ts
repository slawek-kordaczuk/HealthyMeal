import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RecipeService } from "../../recipeService";
import type { GetRecipesQuery } from "../../../../types/types";
import type { SupabaseClient } from "../../../../db/supabase.client";
import { mockUserId, mockRecipes, createMockSupabase, createMockCountQuery, mockDatabaseError } from "./shared-mocks";

describe("RecipeService - getRecipes", () => {
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
    it("should return recipes with default pagination when no query params provided", async () => {
      // Arrange
      const query: GetRecipesQuery = {};

      // Mock count query - create Promise.resolve directly
      const mockCountQuery = createMockCountQuery(3);

      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockRecipes, error: null }),
      };

      // Mock the chain for count query
      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(mockCountQueryBuilder) // First call for count
        .mockReturnValueOnce(mockDataQuery); // Second call for data

      // Act
      const result = await recipeService.getRecipes(mockUserId, query);

      // Assert
      expect(result).toEqual({
        data: mockRecipes,
        total: 3,
      });
      expect(mockSupabase.from).toHaveBeenCalledWith("recipes");
      expect(mockCountQueryBuilder.select).toHaveBeenCalledWith("*", { count: "exact", head: true });
      expect(mockCountQueryBuilder.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockDataQuery.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockDataQuery.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockDataQuery.range).toHaveBeenCalledWith(0, 19); // Default limit 20
    });

    it("should return recipes with custom pagination", async () => {
      // Arrange
      const query: GetRecipesQuery = { page: 2, limit: 10 };
      const mockCountQuery = createMockCountQuery(25);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockRecipes.slice(0, 2), error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      const result = await recipeService.getRecipes(mockUserId, query);

      // Assert
      expect(result.total).toBe(25);
      expect(mockDataQuery.range).toHaveBeenCalledWith(10, 19); // Page 2, limit 10
    });

    it("should return recipes with custom sorting - ascending by name", async () => {
      // Arrange
      const query: GetRecipesQuery = { sortBy: "name", order: "asc" };
      const mockCountQuery = createMockCountQuery(3);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockRecipes, error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      await recipeService.getRecipes(mockUserId, query);

      // Assert
      expect(mockDataQuery.order).toHaveBeenCalledWith("name", { ascending: true });
    });

    it("should return recipes with custom sorting - descending by rating", async () => {
      // Arrange
      const query: GetRecipesQuery = { sortBy: "rating", order: "desc" };
      const mockCountQuery = createMockCountQuery(3);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockRecipes, error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      await recipeService.getRecipes(mockUserId, query);

      // Assert
      expect(mockDataQuery.order).toHaveBeenCalledWith("rating", { ascending: false });
    });
  });

  describe("Search Functionality", () => {
    it("should filter recipes by search term", async () => {
      // Arrange
      const query: GetRecipesQuery = { searchTerm: "Spaghetti" };
      const filteredRecipes = [mockRecipes[0]]; // Only Spaghetti Carbonara

      const mockCountQuery = createMockCountQuery(1);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: filteredRecipes, error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      const result = await recipeService.getRecipes(mockUserId, query);

      // Assert
      expect(result.data).toEqual(filteredRecipes);
      expect(result.total).toBe(1);
      expect(mockCountQueryBuilder.or).toHaveBeenCalledWith("name.ilike.%Spaghetti%");
      expect(mockDataQuery.or).toHaveBeenCalledWith("name.ilike.%Spaghetti%");
    });

    it("should trim search term whitespace", async () => {
      // Arrange
      const query: GetRecipesQuery = { searchTerm: "  Chicken  " };
      const mockCountQuery = createMockCountQuery(1);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [mockRecipes[1]], error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      await recipeService.getRecipes(mockUserId, query);

      // Assert
      expect(mockCountQueryBuilder.or).toHaveBeenCalledWith("name.ilike.%Chicken%");
      expect(mockDataQuery.or).toHaveBeenCalledWith("name.ilike.%Chicken%");
    });

    it("should not apply search filter when search term is empty or whitespace only", async () => {
      // Arrange
      const query: GetRecipesQuery = { searchTerm: "   " };
      const mockCountQuery = createMockCountQuery(3);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockRecipes, error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      await recipeService.getRecipes(mockUserId, query);

      // Assert
      // or() method should not be called when search is not applied
      expect(mockCountQueryBuilder).not.toHaveProperty("or");
      expect(mockDataQuery).not.toHaveProperty("or");
    });
  });

  describe("Edge Cases", () => {
    it("should return empty array when no recipes found", async () => {
      // Arrange
      const query: GetRecipesQuery = {};
      const mockCountQuery = createMockCountQuery(0);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      const result = await recipeService.getRecipes(mockUserId, query);

      // Assert
      expect(result).toEqual({
        data: [],
        total: 0,
      });
    });

    it("should handle null count from database", async () => {
      // Arrange
      const query: GetRecipesQuery = {};
      const mockCountQuery = createMockCountQuery(null);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockRecipes, error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      const result = await recipeService.getRecipes(mockUserId, query);

      // Assert
      expect(result.total).toBe(0); // Should default to 0 when count is null
    });

    it("should handle extreme pagination values", async () => {
      // Arrange
      const query: GetRecipesQuery = { page: 999, limit: 1000 };
      const expectedOffset = (999 - 1) * 1000; // 998000
      const expectedEnd = expectedOffset + 1000 - 1; // 998999

      const mockCountQuery = createMockCountQuery(1000000);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      await recipeService.getRecipes(mockUserId, query);

      // Assert
      expect(mockDataQuery.range).toHaveBeenCalledWith(expectedOffset, expectedEnd);
    });
  });

  describe("Business Rules", () => {
    it("should only return recipes for the specified user", async () => {
      // Arrange
      const query: GetRecipesQuery = {};
      const specificUserId = "user456";
      const mockCountQuery = createMockCountQuery(2);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockRecipes.slice(0, 2), error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      await recipeService.getRecipes(specificUserId, query);

      // Assert
      expect(mockCountQueryBuilder.eq).toHaveBeenCalledWith("user_id", specificUserId);
      expect(mockDataQuery.eq).toHaveBeenCalledWith("user_id", specificUserId);
    });

    it("should apply default values correctly", async () => {
      // Arrange
      const query: GetRecipesQuery = {}; // Empty query object
      const mockCountQuery = createMockCountQuery(3);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockRecipes, error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      await recipeService.getRecipes(mockUserId, query);

      // Assert
      // Verify default values: page=1, limit=20, sortBy="created_at", order="desc"
      expect(mockDataQuery.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockDataQuery.range).toHaveBeenCalledWith(0, 19); // page 1, limit 20
    });

    it("should combine search and pagination correctly", async () => {
      // Arrange
      const query: GetRecipesQuery = {
        searchTerm: "Chicken",
        page: 2,
        limit: 5,
      };
      const mockCountQuery = createMockCountQuery(10);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [mockRecipes[1]], error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      await recipeService.getRecipes(mockUserId, query);

      // Assert
      expect(mockCountQueryBuilder.or).toHaveBeenCalledWith("name.ilike.%Chicken%");
      expect(mockDataQuery.or).toHaveBeenCalledWith("name.ilike.%Chicken%");
      expect(mockDataQuery.range).toHaveBeenCalledWith(5, 9); // page 2, limit 5
    });
  });

  describe("Error Handling", () => {
    it("should throw error when database query fails", async () => {
      // Arrange
      const query: GetRecipesQuery = {};
      const mockCountQuery = createMockCountQuery(3);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: mockDatabaseError }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act & Assert
      await expect(recipeService.getRecipes(mockUserId, query)).rejects.toThrow(
        "Failed to fetch recipes: Database connection failed"
      );
    });

    it("should throw error when count query fails", async () => {
      // Arrange
      const query: GetRecipesQuery = {};
      const databaseError = new Error("Count query failed");

      // Mock the count query to reject
      const mockCountQuery = Promise.reject(databaseError);
      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockCountQuery),
      };

      // Even though count query fails, the code might still try to setup data query
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act & Assert
      await expect(recipeService.getRecipes(mockUserId, query)).rejects.toThrow("Count query failed");
    });
  });

  describe("Integration Tests - Complex Scenarios", () => {
    it("should handle complex query with all parameters", async () => {
      // Arrange
      const query: GetRecipesQuery = {
        page: 3,
        limit: 5,
        sortBy: "rating",
        order: "asc",
        searchTerm: "pasta",
      };
      const mockCountQuery = createMockCountQuery(15);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [mockRecipes[0]], error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      const result = await recipeService.getRecipes(mockUserId, query);

      // Assert
      expect(result.total).toBe(15);
      expect(mockCountQueryBuilder.or).toHaveBeenCalledWith("name.ilike.%pasta%");
      expect(mockDataQuery.or).toHaveBeenCalledWith("name.ilike.%pasta%");
      expect(mockDataQuery.order).toHaveBeenCalledWith("rating", { ascending: true });
      expect(mockDataQuery.range).toHaveBeenCalledWith(10, 14); // page 3, limit 5
    });

    it("should handle search with special characters", async () => {
      // Arrange
      const query: GetRecipesQuery = { searchTerm: "Coq au Vin & Herbs" };
      const mockCountQuery = createMockCountQuery(1);
      const mockDataQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockCountQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnValue(mockCountQuery),
      };

      mockSupabase.from = vi.fn().mockReturnValueOnce(mockCountQueryBuilder).mockReturnValueOnce(mockDataQuery);

      // Act
      await recipeService.getRecipes(mockUserId, query);

      // Assert
      expect(mockCountQueryBuilder.or).toHaveBeenCalledWith("name.ilike.%Coq au Vin & Herbs%");
      expect(mockDataQuery.or).toHaveBeenCalledWith("name.ilike.%Coq au Vin & Herbs%");
    });
  });
});
