import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { PreferencesService } from "../preferencesService";
import type { PreferencesCommandDTO, PreferencesDTO } from "../../../types/types";
import type { Database } from "../../../db/database.types";
import type { SupabaseClient } from "../../../db/supabase.client";

// Mock types for better type safety
interface MockSupabaseClient {
  from: MockedFunction<(table: string) => MockSupabaseQueryBuilder>;
}

interface MockSupabaseQueryBuilder {
  select: MockedFunction<(columns: string) => MockSupabaseQueryBuilder>;
  insert: MockedFunction<(data: Record<string, unknown>) => MockSupabaseQueryBuilder>;
  update: MockedFunction<(data: Record<string, unknown>) => MockSupabaseQueryBuilder>;
  eq: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder>;
  single: MockedFunction<() => Promise<{ data: unknown; error: unknown }>>;
}

type PreferenceRow = Database["public"]["Tables"]["preferences"]["Row"];

// Mock data fixtures
const mockUserId = "user-123";
const mockPreferenceId = 42;

const mockPreferenceRow: PreferenceRow = {
  id: mockPreferenceId,
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
  created_at: "2024-01-01T10:00:00Z",
  updated_at: "2024-01-02T10:00:00Z",
};

const mockPreferencesDTO: PreferencesDTO = {
  id: mockPreferenceId,
  userId: mockUserId,
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

const mockPreferencesCommand: PreferencesCommandDTO = {
  userId: mockUserId,
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

describe("PreferencesService", () => {
  let preferencesService: PreferencesService;
  let mockSupabase: MockSupabaseClient;
  let mockQueryBuilder: MockSupabaseQueryBuilder;

  beforeEach(() => {
    // Create mock query builder
    mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    // Create service instance with mocked client
    preferencesService = new PreferencesService(mockSupabase as unknown as SupabaseClient);
  });

  // ==========================================
  // TESTY createOrUpdatePreferences - TWORZENIE NOWYCH PREFERENCJI
  // ==========================================
  describe("createOrUpdatePreferences - creating new preferences", () => {
    beforeEach(() => {
      // Mock: user has no existing preferences (null result)
      mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null });
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

      // Mock successful insert
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: mockPreferenceRow,
        error: null,
      });

      // Act
      const result = await preferencesService.createOrUpdatePreferences(mockPreferencesCommand);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("preferences");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("id");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expectedInsertData);
      expect(result).toEqual(mockPreferencesDTO);
    });

    it("should handle minimal preferences data", async () => {
      // Arrange
      const minimalCommand: Partial<PreferencesCommandDTO> & { userId: string } = {
        userId: mockUserId,
        diet_type: "standard",
      };

      const minimalRow: PreferenceRow = {
        ...mockPreferenceRow,
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

      const expectedInsertData = {
        user_id: mockUserId,
        diet_type: "standard",
      };

      // Mock successful insert
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: minimalRow,
        error: null,
      });

      // Act
      const result = await preferencesService.createOrUpdatePreferences(minimalCommand);

      // Assert
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expectedInsertData);
      expect(result.diet_type).toBe("standard");
      expect(result.daily_calorie_requirement).toBeNull();
    });

    it("should filter out id and userId fields from insert data", async () => {
      // Arrange
      const commandWithId: PreferencesCommandDTO = {
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

      // Mock successful insert
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: mockPreferenceRow,
        error: null,
      });

      // Act
      await preferencesService.createOrUpdatePreferences(commandWithId);

      // Assert
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expectedInsertData);
      expect(mockQueryBuilder.insert).not.toHaveBeenCalledWith(expect.objectContaining({ id: 999 }));
    });

    it("should throw error when insert fails", async () => {
      // Arrange
      const dbError = { message: "Insert failed", code: "23505" };
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: dbError,
      });

      // Act & Assert
      await expect(preferencesService.createOrUpdatePreferences(mockPreferencesCommand)).rejects.toEqual(dbError);
    });
  });

  // ==========================================
  // TESTY createOrUpdatePreferences - AKTUALIZACJA ISTNIEJĄCYCH PREFERENCJI
  // ==========================================
  describe("createOrUpdatePreferences - updating existing preferences", () => {
    beforeEach(() => {
      // Mock: user has existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: mockPreferenceId },
        error: null,
      });
    });

    it("should update existing preferences when user has them", async () => {
      // Arrange
      const updatedCommand: Partial<PreferencesCommandDTO> & { userId: string } = {
        userId: mockUserId,
        diet_type: "vegan",
        daily_calorie_requirement: 1800,
        allergies: "nuts, soy",
        macro_distribution_protein: 20,
        macro_distribution_fats: 25,
        macro_distribution_carbohydrates: 55,
      };

      const updatedRow: PreferenceRow = {
        ...mockPreferenceRow,
        diet_type: "vegan",
        daily_calorie_requirement: 1800,
        allergies: "nuts, soy",
        macro_distribution_protein: 20,
        macro_distribution_fats: 25,
        macro_distribution_carbohydrates: 55,
      };

      // Mock successful update
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: updatedRow,
        error: null,
      });

      // Act
      const result = await preferencesService.createOrUpdatePreferences(updatedCommand);

      // Assert
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          diet_type: "vegan",
          daily_calorie_requirement: 1800,
          allergies: "nuts, soy",
          macro_distribution_protein: 20,
          macro_distribution_fats: 25,
          macro_distribution_carbohydrates: 55,
          updated_at: expect.any(String),
        })
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", mockPreferenceId);
      expect(result.diet_type).toBe("vegan");
      expect(result.daily_calorie_requirement).toBe(1800);
    });

    it("should include updated_at timestamp in update", async () => {
      // Arrange
      const beforeTime = new Date().toISOString();

      // Mock successful update
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: mockPreferenceRow,
        error: null,
      });

      // Act
      await preferencesService.createOrUpdatePreferences(mockPreferencesCommand);

      const afterTime = new Date().toISOString();

      // Assert
      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(updateCall.updated_at).toBeDefined();
      expect(updateCall.updated_at).toBeTypeOf("string");
      expect(new Date(updateCall.updated_at as string).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTime).getTime()
      );
      expect(new Date(updateCall.updated_at as string).getTime()).toBeLessThanOrEqual(new Date(afterTime).getTime());
    });

    it("should handle partial updates", async () => {
      // Arrange
      const partialCommand: Partial<PreferencesCommandDTO> & { userId: string } = {
        userId: mockUserId,
        diet_type: "pescatarian",
        // Only updating diet type
      };

      const expectedUpdateData = {
        diet_type: "pescatarian",
        updated_at: expect.any(String),
      };

      // Mock successful update
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { ...mockPreferenceRow, diet_type: "pescatarian" },
        error: null,
      });

      // Act
      await preferencesService.createOrUpdatePreferences(partialCommand);

      // Assert
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(expectedUpdateData);
    });

    it("should throw error when update fails", async () => {
      // Arrange
      const dbError = { message: "Update failed", code: "23502" };
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: dbError,
      });

      // Act & Assert
      await expect(preferencesService.createOrUpdatePreferences(mockPreferencesCommand)).rejects.toEqual(dbError);
    });
  });

  // ==========================================
  // TESTY getUserPreferences - POBIERANIE PREFERENCJI
  // ==========================================
  describe("getUserPreferences", () => {
    it("should return user preferences when they exist", async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValue({
        data: mockPreferenceRow,
        error: null,
      });

      // Act
      const result = await preferencesService.getUserPreferences(mockUserId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("preferences");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockQueryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(mockPreferencesDTO);
    });

    it("should return null when user has no preferences (PGRST116 error)", async () => {
      // Arrange
      const noDataError = { code: "PGRST116", message: "No rows found" };
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: noDataError,
      });

      // Act
      const result = await preferencesService.getUserPreferences(mockUserId);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when data is null but no error", async () => {
      // Arrange
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act
      const result = await preferencesService.getUserPreferences(mockUserId);

      // Assert
      expect(result).toBeNull();
    });

    it("should throw error for other database errors", async () => {
      // Arrange
      const dbError = { code: "42P01", message: "Table does not exist" };
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act & Assert
      await expect(preferencesService.getUserPreferences(mockUserId)).rejects.toThrow(
        "Failed to fetch preferences: Table does not exist"
      );
    });

    it("should handle preferences with null values", async () => {
      // Arrange
      const sparsePreferenceRow: PreferenceRow = {
        id: mockPreferenceId,
        user_id: mockUserId,
        diet_type: null,
        daily_calorie_requirement: null,
        allergies: null,
        food_intolerances: null,
        preferred_cuisines: null,
        excluded_ingredients: null,
        macro_distribution_protein: null,
        macro_distribution_fats: null,
        macro_distribution_carbohydrates: null,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: null,
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: sparsePreferenceRow,
        error: null,
      });

      // Act
      const result = await preferencesService.getUserPreferences(mockUserId);

      // Assert
      expect(result).toEqual({
        id: mockPreferenceId,
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
  });

  // ==========================================
  // TESTY mapToDTO - PRYWATNA METODA (testowana pośrednio)
  // ==========================================
  describe("mapToDTO (tested through public methods)", () => {
    it("should correctly map all database fields to DTO", async () => {
      // Arrange
      const fullPreferenceRow: PreferenceRow = {
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
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: fullPreferenceRow,
        error: null,
      });

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
      const zeroValuesRow: PreferenceRow = {
        ...mockPreferenceRow,
        daily_calorie_requirement: 0,
        macro_distribution_protein: 0,
        macro_distribution_fats: 0,
        macro_distribution_carbohydrates: 0,
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: zeroValuesRow,
        error: null,
      });

      // Act
      const result = await preferencesService.getUserPreferences(mockUserId);

      // Assert
      expect(result?.daily_calorie_requirement).toBe(0);
      expect(result?.macro_distribution_protein).toBe(0);
      expect(result?.macro_distribution_fats).toBe(0);
      expect(result?.macro_distribution_carbohydrates).toBe(0);
    });
  });

  // ==========================================
  // TESTY SCENARIUSZY RZECZYWISTYCH
  // ==========================================
  describe("real-world scenarios", () => {
    it("should handle complete user onboarding flow", async () => {
      // Arrange: New user with complete preferences
      const newUserCommand: PreferencesCommandDTO = {
        userId: "new-user-789",
        diet_type: "mediterranean",
        daily_calorie_requirement: 2200,
        allergies: "nuts",
        food_intolerances: "dairy",
        preferred_cuisines: "Mediterranean, Greek",
        excluded_ingredients: "processed foods",
        macro_distribution_protein: 25,
        macro_distribution_fats: 35,
        macro_distribution_carbohydrates: 40,
      };

      // Mock: No existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null });

      // Mock: Successful creation
      const createdRow: PreferenceRow = {
        id: 789,
        user_id: "new-user-789",
        diet_type: "mediterranean",
        daily_calorie_requirement: 2200,
        allergies: "nuts",
        food_intolerances: "dairy",
        preferred_cuisines: "Mediterranean, Greek",
        excluded_ingredients: "processed foods",
        macro_distribution_protein: 25,
        macro_distribution_fats: 35,
        macro_distribution_carbohydrates: 40,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: null,
      };

      mockQueryBuilder.single.mockResolvedValueOnce({
        data: createdRow,
        error: null,
      });

      // Act
      const result = await preferencesService.createOrUpdatePreferences(newUserCommand);

      // Assert
      expect(result.userId).toBe("new-user-789");
      expect(result.diet_type).toBe("mediterranean");
      expect(result.macro_distribution_protein).toBe(25);
      expect(result.macro_distribution_fats).toBe(35);
      expect(result.macro_distribution_carbohydrates).toBe(40);
    });

    it("should handle user preference update flow", async () => {
      // Arrange: Existing user updating preferences
      const updateCommand: Partial<PreferencesCommandDTO> & { userId: string } = {
        userId: mockUserId,
        diet_type: "flexitarian",
        daily_calorie_requirement: 1900,
        allergies: null, // Clearing previous allergies
        macro_distribution_protein: 22,
        macro_distribution_fats: 28,
        macro_distribution_carbohydrates: 50,
      };

      // Mock: Existing preferences found
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: mockPreferenceId },
        error: null,
      });

      // Mock: Successful update
      const updatedRow: PreferenceRow = {
        ...mockPreferenceRow,
        diet_type: "flexitarian",
        daily_calorie_requirement: 1900,
        allergies: null,
        macro_distribution_protein: 22,
        macro_distribution_fats: 28,
        macro_distribution_carbohydrates: 50,
      };

      mockQueryBuilder.single.mockResolvedValueOnce({
        data: updatedRow,
        error: null,
      });

      // Act
      const result = await preferencesService.createOrUpdatePreferences(updateCommand);

      // Assert
      expect(result.diet_type).toBe("flexitarian");
      expect(result.daily_calorie_requirement).toBe(1900);
      expect(result.allergies).toBeNull();
      expect(result.macro_distribution_protein).toBe(22);
    });
  });

  // ==========================================
  // TESTY WARUNKÓW BRZEGOWYCH
  // ==========================================
  describe("edge cases", () => {
    it("should handle empty preferences command", async () => {
      // Arrange
      const emptyCommand: Partial<PreferencesCommandDTO> & { userId: string } = {
        userId: mockUserId,
      };

      // Mock: No existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null });

      // Mock: Successful creation with minimal data
      const minimalRow: PreferenceRow = {
        id: 999,
        user_id: mockUserId,
        diet_type: null,
        daily_calorie_requirement: null,
        allergies: null,
        food_intolerances: null,
        preferred_cuisines: null,
        excluded_ingredients: null,
        macro_distribution_protein: null,
        macro_distribution_fats: null,
        macro_distribution_carbohydrates: null,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: null,
      };

      mockQueryBuilder.single.mockResolvedValueOnce({
        data: minimalRow,
        error: null,
      });

      // Act
      const result = await preferencesService.createOrUpdatePreferences(emptyCommand);

      // Assert
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({ user_id: mockUserId });
      expect(result.userId).toBe(mockUserId);
      expect(
        Object.values(result)
          .filter((v) => v !== mockUserId && v !== 999)
          .every((v) => v === null)
      ).toBe(true);
    });

    it("should handle very long text values", async () => {
      // Arrange
      const longText = "A".repeat(5000);
      const longTextCommand: Partial<PreferencesCommandDTO> & { userId: string } = {
        userId: mockUserId,
        diet_type: longText,
        allergies: longText,
        preferred_cuisines: longText,
      };

      // Mock: No existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null });

      // Mock: Successful creation
      const longTextRow: PreferenceRow = {
        ...mockPreferenceRow,
        diet_type: longText,
        allergies: longText,
        preferred_cuisines: longText,
      };

      mockQueryBuilder.single.mockResolvedValueOnce({
        data: longTextRow,
        error: null,
      });

      // Act
      const result = await preferencesService.createOrUpdatePreferences(longTextCommand);

      // Assert
      expect(result.diet_type).toBe(longText);
      expect(result.allergies).toBe(longText);
      expect(result.preferred_cuisines).toBe(longText);
    });

    it("should handle special characters in text fields", async () => {
      // Arrange
      const specialCharactersCommand: Partial<PreferencesCommandDTO> & { userId: string } = {
        userId: mockUserId,
        diet_type: "диета с émoji 🥗 & symbols <>&",
        allergies: "орехи, café, naïve résumé",
        preferred_cuisines: "中文, العربية, русский",
      };

      // Mock: No existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null });

      // Mock: Successful creation
      const specialCharRow: PreferenceRow = {
        ...mockPreferenceRow,
        diet_type: "диета с émoji 🥗 & symbols <>&",
        allergies: "орехи, café, naïve résumé",
        preferred_cuisines: "中文, العربية, русский",
      };

      mockQueryBuilder.single.mockResolvedValueOnce({
        data: specialCharRow,
        error: null,
      });

      // Act
      const result = await preferencesService.createOrUpdatePreferences(specialCharactersCommand);

      // Assert
      expect(result.diet_type).toBe("диета с émoji 🥗 & symbols <>&");
      expect(result.allergies).toBe("орехи, café, naïve résumé");
      expect(result.preferred_cuisines).toBe("中文, العربية, русский");
    });

    it("should handle extreme macro distribution values", async () => {
      // Arrange
      const extremeMacroCommand: Partial<PreferencesCommandDTO> & { userId: string } = {
        userId: mockUserId,
        macro_distribution_protein: 0,
        macro_distribution_fats: 0,
        macro_distribution_carbohydrates: 100,
      };

      // Mock: No existing preferences
      mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null });

      // Mock: Successful creation
      const extremeMacroRow: PreferenceRow = {
        ...mockPreferenceRow,
        macro_distribution_protein: 0,
        macro_distribution_fats: 0,
        macro_distribution_carbohydrates: 100,
      };

      mockQueryBuilder.single.mockResolvedValueOnce({
        data: extremeMacroRow,
        error: null,
      });

      // Act
      const result = await preferencesService.createOrUpdatePreferences(extremeMacroCommand);

      // Assert
      expect(result.macro_distribution_protein).toBe(0);
      expect(result.macro_distribution_fats).toBe(0);
      expect(result.macro_distribution_carbohydrates).toBe(100);
    });

    it("should handle database connection issues gracefully", async () => {
      // Arrange
      const connectionError = {
        message: "Connection timeout",
        code: "ETIMEDOUT",
        details: "Network issue",
      };

      mockQueryBuilder.single.mockRejectedValue(connectionError);

      // Act & Assert
      await expect(preferencesService.createOrUpdatePreferences(mockPreferencesCommand)).rejects.toEqual(
        connectionError
      );
    });
  });
});
