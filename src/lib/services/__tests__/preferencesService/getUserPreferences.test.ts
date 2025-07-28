import { describe, it, expect, beforeEach } from "vitest";
import { PreferencesService } from "../../preferencesService";
import type { SupabaseClient } from "../../../../db/supabase.client";
import {
  createMockSupabase,
  mockSuccessResponse,
  mockErrorResponse,
  mockNoDataResponse,
  expectQueryStructure,
  expectUserQuery,
  type MockSupabaseClient,
  type MockSupabaseQueryBuilder,
} from "./shared-mocks";
import {
  mockUserId,
  mockPreferenceRow,
  mockPreferencesDTO,
  createMockPreferenceRow,
  sparsePreferenceRow,
  errorScenarios,
} from "./fixtures";

describe("PreferencesService - getUserPreferences", () => {
  let preferencesService: PreferencesService;
  let mockSupabase: MockSupabaseClient;
  let mockQueryBuilder: MockSupabaseQueryBuilder;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    mockQueryBuilder = mocks.mockQueryBuilder;
    preferencesService = new PreferencesService(mockSupabase as unknown as SupabaseClient);
  });

  describe("Successful retrieval", () => {
    it("should return user preferences when they exist", async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValue(mockSuccessResponse(mockPreferenceRow));

      // Act
      const result = await preferencesService.getUserPreferences(mockUserId);

      // Assert
      expectQueryStructure(mockSupabase, mockQueryBuilder, "preferences");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("*");
      expectUserQuery(mockQueryBuilder, mockUserId);
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(mockPreferencesDTO);
    });

    it("should handle preferences with null values", async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValue(mockSuccessResponse(sparsePreferenceRow));

      // Act
      const result = await preferencesService.getUserPreferences(mockUserId);

      // Assert
      expect(result).toEqual({
        id: mockPreferenceRow.id,
        userId: mockUserId,
        diet_type: null,
        daily_calorie_requirement: null,
        allergies: null,
        food_intolerances: null,
        preferred_cuisines: null,
        excluded_ingredients: null,
        macro_distribution_protein: null,
        macro_distribution_fats: null,
        macro_distribution_carbohydrates: null,
      });
    });

    it("should correctly map all database fields to DTO", async () => {
      // Arrange
      const fullPreferenceRow = createMockPreferenceRow({
        id: 123,
        user_id: "user-456",
        diet_type: "keto",
        daily_calorie_requirement: 2500,
        allergies: "shellfish, eggs",
        food_intolerances: "gluten, lactose",
        preferred_cuisines: "Asian, European",
        excluded_ingredients: "sugar, flour",
        macro_distribution_protein: 30,
        macro_distribution_fats: 65,
        macro_distribution_carbohydrates: 5,
      });

      mockQueryBuilder.single.mockResolvedValue(mockSuccessResponse(fullPreferenceRow));

      // Act
      const result = await preferencesService.getUserPreferences("user-456");

      // Assert
      expect(result).toEqual({
        id: 123,
        userId: "user-456", // Note: mapped from user_id
        diet_type: "keto",
        daily_calorie_requirement: 2500,
        allergies: "shellfish, eggs",
        food_intolerances: "gluten, lactose",
        preferred_cuisines: "Asian, European",
        excluded_ingredients: "sugar, flour",
        macro_distribution_protein: 30,
        macro_distribution_fats: 65,
        macro_distribution_carbohydrates: 5,
      });
    });

    it("should handle zero values correctly", async () => {
      // Arrange
      const zeroValuesRow = createMockPreferenceRow({
        daily_calorie_requirement: 0,
        macro_distribution_protein: 0,
        macro_distribution_fats: 0,
        macro_distribution_carbohydrates: 0,
      });

      mockQueryBuilder.single.mockResolvedValue(mockSuccessResponse(zeroValuesRow));

      // Act
      const result = await preferencesService.getUserPreferences(mockUserId);

      // Assert
      expect(result?.daily_calorie_requirement).toBe(0);
      expect(result?.macro_distribution_protein).toBe(0);
      expect(result?.macro_distribution_fats).toBe(0);
      expect(result?.macro_distribution_carbohydrates).toBe(0);
    });
  });

  describe("No data scenarios", () => {
    it("should return null when user has no preferences (PGRST116 error)", async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValue(mockErrorResponse(errorScenarios.noDataFound));

      // Act
      const result = await preferencesService.getUserPreferences(mockUserId);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when data is null but no error", async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValue(mockNoDataResponse());

      // Act
      const result = await preferencesService.getUserPreferences(mockUserId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("Error handling", () => {
    it("should throw error for other database errors", async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValue(mockErrorResponse(errorScenarios.tableNotExists));

      // Act & Assert
      await expect(preferencesService.getUserPreferences(mockUserId)).rejects.toThrow(
        "Failed to fetch preferences: Table does not exist"
      );
    });

    it("should handle database connection issues gracefully", async () => {
      // Arrange
      mockQueryBuilder.single.mockRejectedValue(errorScenarios.connectionTimeout);

      // Act & Assert
      await expect(preferencesService.getUserPreferences(mockUserId)).rejects.toEqual(errorScenarios.connectionTimeout);
    });
  });

  describe("Different user scenarios", () => {
    it("should work with different user IDs", async () => {
      // Arrange
      const differentUserId = "different-user-456";
      const differentUserRow = createMockPreferenceRow({
        user_id: differentUserId,
        diet_type: "paleo",
      });

      mockQueryBuilder.single.mockResolvedValue(mockSuccessResponse(differentUserRow));

      // Act
      const result = await preferencesService.getUserPreferences(differentUserId);

      // Assert
      expectUserQuery(mockQueryBuilder, differentUserId);
      expect(result?.userId).toBe(differentUserId);
      expect(result?.diet_type).toBe("paleo");
    });
  });
});
