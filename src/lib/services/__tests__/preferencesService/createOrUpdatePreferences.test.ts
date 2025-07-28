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
  expectInsertCall,
  expectUpdateCall,
  expectTimestampInUpdate,
  type MockSupabaseClient,
  type MockSupabaseQueryBuilder,
} from "./shared-mocks";
import {
  mockUserId,
  mockPreferenceId,
  mockPreferenceRow,
  mockPreferencesDTO,
  mockPreferencesCommand,
  createMockPreferenceRow,
  createMockPreferencesCommand,
  minimalPreferenceRow,
  errorScenarios,
} from "./fixtures";

describe("PreferencesService - createOrUpdatePreferences", () => {
  let preferencesService: PreferencesService;
  let mockSupabase: MockSupabaseClient;
  let mockQueryBuilder: MockSupabaseQueryBuilder;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    mockQueryBuilder = mocks.mockQueryBuilder;
    preferencesService = new PreferencesService(mockSupabase as unknown as SupabaseClient);
  });

  describe("Creating new preferences", () => {
    beforeEach(() => {
      // Mock: user has no existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce(mockNoDataResponse());
    });

    it("should create new preferences when user has none", async () => {
      // Arrange
      const expectedInsertData = {
        user_id: mockUserId,
        diet_type: "vegetarian",
        daily_calorie_requirement: 2000,
        allergies: "nuts",
        food_intolerances: "lactose",
        preferred_cuisines: "Mediterranean",
        excluded_ingredients: "meat",
        macro_distribution_protein: 25,
        macro_distribution_fats: 30,
        macro_distribution_carbohydrates: 45,
      };

      mockQueryBuilder.single.mockResolvedValueOnce(mockSuccessResponse(mockPreferenceRow));

      // Act
      const result = await preferencesService.createOrUpdatePreferences(mockPreferencesCommand);

      // Assert
      expectQueryStructure(mockSupabase, mockQueryBuilder, "preferences");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("id");
      expectUserQuery(mockQueryBuilder, mockUserId);
      expectInsertCall(mockQueryBuilder, expectedInsertData);
      expect(result).toEqual(mockPreferencesDTO);
    });

    it("should handle minimal preferences data", async () => {
      // Arrange
      const minimalCommand = createMockPreferencesCommand({
        userId: mockUserId,
        diet_type: "standard",
        daily_calorie_requirement: undefined,
        allergies: undefined,
        food_intolerances: undefined,
        preferred_cuisines: undefined,
        excluded_ingredients: undefined,
        macro_distribution_protein: undefined,
        macro_distribution_fats: undefined,
        macro_distribution_carbohydrates: undefined,
      });

      const expectedInsertData = {
        user_id: mockUserId,
        diet_type: "standard",
      };

      mockQueryBuilder.single.mockResolvedValueOnce(mockSuccessResponse(minimalPreferenceRow));

      // Act
      const result = await preferencesService.createOrUpdatePreferences(minimalCommand);

      // Assert
      expectInsertCall(mockQueryBuilder, expectedInsertData);
      expect(result.diet_type).toBe("standard");
      expect(result.daily_calorie_requirement).toBeNull();
    });

    it("should filter out id and userId fields from insert data", async () => {
      // Arrange
      const commandWithId = {
        ...mockPreferencesCommand,
        id: 999, // This should be filtered out
      };

      const expectedInsertData = {
        user_id: mockUserId,
        diet_type: "vegetarian",
        daily_calorie_requirement: 2000,
        allergies: "nuts",
        food_intolerances: "lactose",
        preferred_cuisines: "Mediterranean",
        excluded_ingredients: "meat",
        macro_distribution_protein: 25,
        macro_distribution_fats: 30,
        macro_distribution_carbohydrates: 45,
      };

      mockQueryBuilder.single.mockResolvedValueOnce(mockSuccessResponse(mockPreferenceRow));

      // Act
      await preferencesService.createOrUpdatePreferences(commandWithId);

      // Assert
      expectInsertCall(mockQueryBuilder, expectedInsertData);
      expect(mockQueryBuilder.insert).not.toHaveBeenCalledWith(expect.objectContaining({ id: 999 }));
    });

    it("should throw error when insert fails", async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValueOnce(mockErrorResponse(errorScenarios.insertFailed));

      // Act & Assert
      await expect(preferencesService.createOrUpdatePreferences(mockPreferencesCommand)).rejects.toEqual(
        errorScenarios.insertFailed
      );
    });
  });

  describe("Updating existing preferences", () => {
    beforeEach(() => {
      // Mock: user has existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce(mockSuccessResponse({ id: mockPreferenceId }));
    });

    it("should update existing preferences when user has them", async () => {
      // Arrange
      const updateCommand = {
        userId: mockUserId,
        diet_type: "vegan",
        daily_calorie_requirement: 1800,
        allergies: "nuts, soy",
        macro_distribution_protein: 20,
        macro_distribution_fats: 25,
        macro_distribution_carbohydrates: 55,
      };

      const updatedRow = createMockPreferenceRow({
        diet_type: "vegan",
        daily_calorie_requirement: 1800,
        allergies: "nuts, soy",
        macro_distribution_protein: 20,
        macro_distribution_fats: 25,
        macro_distribution_carbohydrates: 55,
      });

      mockQueryBuilder.single.mockResolvedValueOnce(mockSuccessResponse(updatedRow));

      // Act
      const result = await preferencesService.createOrUpdatePreferences(updateCommand);

      // Assert
      expectUpdateCall(mockQueryBuilder, {
        diet_type: "vegan",
        daily_calorie_requirement: 1800,
        allergies: "nuts, soy",
        macro_distribution_protein: 20,
        macro_distribution_fats: 25,
        macro_distribution_carbohydrates: 55,
      });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", mockPreferenceId);
      expect(result.diet_type).toBe("vegan");
      expect(result.daily_calorie_requirement).toBe(1800);
    });

    it("should include updated_at timestamp in update", async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValueOnce(mockSuccessResponse(mockPreferenceRow));

      // Act
      await preferencesService.createOrUpdatePreferences(mockPreferencesCommand);

      // Assert
      expectTimestampInUpdate(mockQueryBuilder);
    });

    it("should handle partial updates", async () => {
      // Arrange
      const partialCommand = {
        userId: mockUserId,
        diet_type: "pescatarian",
        // Only updating diet type
      };

      mockQueryBuilder.single.mockResolvedValueOnce(
        mockSuccessResponse(createMockPreferenceRow({ diet_type: "pescatarian" }))
      );

      // Act
      await preferencesService.createOrUpdatePreferences(partialCommand);

      // Assert
      expectUpdateCall(mockQueryBuilder, { diet_type: "pescatarian" });
    });

    it("should throw error when update fails", async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValueOnce(mockErrorResponse(errorScenarios.updateFailed));

      // Act & Assert
      await expect(preferencesService.createOrUpdatePreferences(mockPreferencesCommand)).rejects.toEqual(
        errorScenarios.updateFailed
      );
    });
  });

  describe("Input validation and filtering", () => {
    beforeEach(() => {
      mockQueryBuilder.single.mockResolvedValueOnce(mockNoDataResponse());
    });

    it("should handle empty preferences command", async () => {
      // Arrange
      const emptyCommand = { userId: mockUserId };

      mockQueryBuilder.single.mockResolvedValueOnce(
        mockSuccessResponse(
          createMockPreferenceRow({
            diet_type: null,
            daily_calorie_requirement: null,
            allergies: null,
            food_intolerances: null,
            preferred_cuisines: null,
            excluded_ingredients: null,
            macro_distribution_protein: null,
            macro_distribution_fats: null,
            macro_distribution_carbohydrates: null,
          })
        )
      );

      // Act
      const result = await preferencesService.createOrUpdatePreferences(emptyCommand);

      // Assert
      expectInsertCall(mockQueryBuilder, { user_id: mockUserId });
      expect(result.userId).toBe(mockUserId);
    });

    it("should filter out undefined values from command", async () => {
      // Arrange
      const commandWithUndefined = {
        userId: mockUserId,
        diet_type: "vegetarian",
        daily_calorie_requirement: undefined,
        allergies: "nuts",
        food_intolerances: undefined,
      };

      const expectedInsertData = {
        user_id: mockUserId,
        diet_type: "vegetarian",
        allergies: "nuts",
      };

      mockQueryBuilder.single.mockResolvedValueOnce(mockSuccessResponse(mockPreferenceRow));

      // Act
      await preferencesService.createOrUpdatePreferences(commandWithUndefined);

      // Assert
      expectInsertCall(mockQueryBuilder, expectedInsertData);
    });
  });
});
