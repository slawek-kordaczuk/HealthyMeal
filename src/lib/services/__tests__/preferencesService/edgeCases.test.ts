import { describe, it, expect, beforeEach } from "vitest";
import { PreferencesService } from "../../preferencesService";
import type { SupabaseClient } from "../../../../db/supabase.client";
import {
  createMockSupabase,
  mockSuccessResponse,
  mockNoDataResponse,
  expectUpdateCall,
  type MockSupabaseClient,
  type MockSupabaseQueryBuilder,
} from "./shared-mocks";
import {
  mockUserId,
  mockPreferenceId,
  createMockPreferenceRow,
  createMockPreferencesCommand,
  scenarios,
  edgeCases,
} from "./fixtures";

describe("PreferencesService - Edge Cases & Real-World Scenarios", () => {
  let preferencesService: PreferencesService;
  let mockSupabase: MockSupabaseClient;
  let mockQueryBuilder: MockSupabaseQueryBuilder;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    mockQueryBuilder = mocks.mockQueryBuilder;
    preferencesService = new PreferencesService(mockSupabase as unknown as SupabaseClient);
  });

  describe("Real-world scenarios", () => {
    it("should handle complete user onboarding flow", async () => {
      // Arrange: New user with complete preferences
      const { command, expectedRow } = scenarios.newUser;

      // Mock: No existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce(mockNoDataResponse());
      // Mock: Successful creation
      mockQueryBuilder.single.mockResolvedValueOnce(mockSuccessResponse(expectedRow));

      // Act
      const result = await preferencesService.createOrUpdatePreferences(command);

      // Assert
      expect(result.userId).toBe("new-user-789");
      expect(result.diet_type).toBe("mediterranean");
      expect(result.macro_distribution_protein).toBe(25);
      expect(result.macro_distribution_fats).toBe(35);
      expect(result.macro_distribution_carbohydrates).toBe(40);
    });

    it("should handle user preference update flow", async () => {
      // Arrange: Existing user updating preferences
      const { command, expectedRow } = scenarios.updateUser;

      // Mock: Existing preferences found
      mockQueryBuilder.single.mockResolvedValueOnce(mockSuccessResponse({ id: mockPreferenceId }));
      // Mock: Successful update
      mockQueryBuilder.single.mockResolvedValueOnce(mockSuccessResponse(expectedRow));

      // Act
      const result = await preferencesService.createOrUpdatePreferences(command);

      // Assert
      expect(result.diet_type).toBe("flexitarian");
      expect(result.daily_calorie_requirement).toBe(1900);
      expect(result.allergies).toBeNull();
      expect(result.macro_distribution_protein).toBe(22);
    });

    it("should handle user clearing all preferences", async () => {
      // Arrange
      const clearCommand = {
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
      };

      // Mock: Existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce(mockSuccessResponse({ id: mockPreferenceId }));
      // Mock: Successful update with nulls
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
      const result = await preferencesService.createOrUpdatePreferences(clearCommand);

      // Assert
      expect(result.diet_type).toBeNull();
      expect(result.daily_calorie_requirement).toBeNull();
      expect(result.allergies).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("should handle very long text values", async () => {
      // Arrange
      const longTextCommand = createMockPreferencesCommand({
        diet_type: edgeCases.longText,
        allergies: edgeCases.longText,
        preferred_cuisines: edgeCases.longText,
      });

      // Mock: No existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce(mockNoDataResponse());
      // Mock: Successful creation
      mockQueryBuilder.single.mockResolvedValueOnce(
        mockSuccessResponse(
          createMockPreferenceRow({
            diet_type: edgeCases.longText,
            allergies: edgeCases.longText,
            preferred_cuisines: edgeCases.longText,
          })
        )
      );

      // Act
      const result = await preferencesService.createOrUpdatePreferences(longTextCommand);

      // Assert
      expect(result.diet_type).toBe(edgeCases.longText);
      expect(result.allergies).toBe(edgeCases.longText);
      expect(result.preferred_cuisines).toBe(edgeCases.longText);
    });

    it("should handle special characters in text fields", async () => {
      // Arrange
      const specialCharactersCommand = createMockPreferencesCommand(edgeCases.specialCharacters);

      // Mock: No existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce(mockNoDataResponse());
      // Mock: Successful creation
      mockQueryBuilder.single.mockResolvedValueOnce(
        mockSuccessResponse(createMockPreferenceRow(edgeCases.specialCharacters))
      );

      // Act
      const result = await preferencesService.createOrUpdatePreferences(specialCharactersCommand);

      // Assert
      expect(result.diet_type).toBe("диета с émoji 🥗 & symbols <>&");
      expect(result.allergies).toBe("орехи, café, naïve résumé");
      expect(result.preferred_cuisines).toBe("中文, العربية, русский");
    });

    it("should handle extreme macro distribution values", async () => {
      // Arrange
      const extremeMacroCommand = createMockPreferencesCommand(edgeCases.extremeMacros);

      // Mock: No existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce(mockNoDataResponse());
      // Mock: Successful creation
      mockQueryBuilder.single.mockResolvedValueOnce(
        mockSuccessResponse(createMockPreferenceRow(edgeCases.extremeMacros))
      );

      // Act
      const result = await preferencesService.createOrUpdatePreferences(extremeMacroCommand);

      // Assert
      expect(result.macro_distribution_protein).toBe(0);
      expect(result.macro_distribution_fats).toBe(0);
      expect(result.macro_distribution_carbohydrates).toBe(100);
    });

    it("should handle mixed update with some null and some values", async () => {
      // Arrange
      const mixedCommand = {
        userId: mockUserId,
        diet_type: "mixed_diet",
        daily_calorie_requirement: 2100,
        allergies: null, // Clearing this
        food_intolerances: "some intolerance", // Setting this
        preferred_cuisines: null, // Clearing this
        macro_distribution_protein: 20,
        macro_distribution_fats: null, // Clearing this
        macro_distribution_carbohydrates: 80,
      };

      // Mock: Existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce(mockSuccessResponse({ id: mockPreferenceId }));
      // Mock: Successful update
      mockQueryBuilder.single.mockResolvedValueOnce(
        mockSuccessResponse(
          createMockPreferenceRow({
            diet_type: "mixed_diet",
            daily_calorie_requirement: 2100,
            allergies: null,
            food_intolerances: "some intolerance",
            preferred_cuisines: null,
            macro_distribution_protein: 20,
            macro_distribution_fats: null,
            macro_distribution_carbohydrates: 80,
          })
        )
      );

      // Act
      const result = await preferencesService.createOrUpdatePreferences(mixedCommand);

      // Assert
      expectUpdateCall(mockQueryBuilder, {
        diet_type: "mixed_diet",
        daily_calorie_requirement: 2100,
        allergies: null,
        food_intolerances: "some intolerance",
        preferred_cuisines: null,
        macro_distribution_protein: 20,
        macro_distribution_fats: null,
        macro_distribution_carbohydrates: 80,
      });
      expect(result.diet_type).toBe("mixed_diet");
      expect(result.allergies).toBeNull();
      expect(result.food_intolerances).toBe("some intolerance");
    });

    it("should handle rapid successive calls with same user", async () => {
      // This test simulates rapid user interactions
      // Arrange
      const firstCommand = createMockPreferencesCommand({ diet_type: "first" });
      const secondCommand = createMockPreferencesCommand({ diet_type: "second" });

      // Mock first call - create
      mockQueryBuilder.single.mockResolvedValueOnce(mockNoDataResponse());
      mockQueryBuilder.single.mockResolvedValueOnce(
        mockSuccessResponse(createMockPreferenceRow({ diet_type: "first" }))
      );

      // Mock second call - update
      mockQueryBuilder.single.mockResolvedValueOnce(mockSuccessResponse({ id: mockPreferenceId }));
      mockQueryBuilder.single.mockResolvedValueOnce(
        mockSuccessResponse(createMockPreferenceRow({ diet_type: "second" }))
      );

      // Act
      const firstResult = await preferencesService.createOrUpdatePreferences(firstCommand);
      const secondResult = await preferencesService.createOrUpdatePreferences(secondCommand);

      // Assert
      expect(firstResult.diet_type).toBe("first");
      expect(secondResult.diet_type).toBe("second");
    });
  });

  describe("Performance and stress scenarios", () => {
    it("should handle preferences with maximum field lengths", async () => {
      // Arrange - Test with maximum realistic field lengths
      const maxLengthCommand = createMockPreferencesCommand({
        diet_type: "a".repeat(100),
        allergies: "b".repeat(1000),
        food_intolerances: "c".repeat(1000),
        preferred_cuisines: "d".repeat(1000),
        excluded_ingredients: "e".repeat(1000),
      });

      // Mock: No existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce(mockNoDataResponse());
      // Mock: Successful creation
      mockQueryBuilder.single.mockResolvedValueOnce(
        mockSuccessResponse(
          createMockPreferenceRow({
            diet_type: "a".repeat(100),
            allergies: "b".repeat(1000),
            food_intolerances: "c".repeat(1000),
            preferred_cuisines: "d".repeat(1000),
            excluded_ingredients: "e".repeat(1000),
          })
        )
      );

      // Act
      const result = await preferencesService.createOrUpdatePreferences(maxLengthCommand);

      // Assert
      expect(result.diet_type).toBe("a".repeat(100));
      expect(result.allergies).toBe("b".repeat(1000));
      expect(result.food_intolerances).toBe("c".repeat(1000));
      expect(result.preferred_cuisines).toBe("d".repeat(1000));
      expect(result.excluded_ingredients).toBe("e".repeat(1000));
    });
  });
});
