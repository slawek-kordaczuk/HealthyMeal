import type { PreferencesCommandDTO, PreferencesDTO } from "../../../../types/types";
import type { Database } from "../../../../db/database.types";

type PreferenceRow = Database["public"]["Tables"]["preferences"]["Row"];

// Mock user IDs
export const mockUserId = "user-123";
export const mockPreferenceId = 42;

// Mock preference row (database format)
export const mockPreferenceRow: PreferenceRow = {
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

// Mock preferences DTO (API format)
export const mockPreferencesDTO: PreferencesDTO = {
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

// Mock preferences command (input format)
export const mockPreferencesCommand: PreferencesCommandDTO = {
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

// Factory functions for creating test data with overrides
export function createMockPreferenceRow(overrides: Partial<PreferenceRow> = {}): PreferenceRow {
  return {
    ...mockPreferenceRow,
    ...overrides,
  };
}

export function createMockPreferencesDTO(overrides: Partial<PreferencesDTO> = {}): PreferencesDTO {
  return {
    ...mockPreferencesDTO,
    ...overrides,
  };
}

export function createMockPreferencesCommand(overrides: Partial<PreferencesCommandDTO> = {}): PreferencesCommandDTO {
  return {
    ...mockPreferencesCommand,
    ...overrides,
  };
}

// Minimal test data
export const minimalPreferenceRow: PreferenceRow = {
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

// Sparse preferences for testing null values
export const sparsePreferenceRow: PreferenceRow = {
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

// Test data for real-world scenarios
export const scenarios = {
  newUser: {
    command: createMockPreferencesCommand({
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
    }),
    expectedRow: createMockPreferenceRow({
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
    }),
  },

  updateUser: {
    command: {
      userId: mockUserId,
      diet_type: "flexitarian",
      daily_calorie_requirement: 1900,
      allergies: null,
      macro_distribution_protein: 22,
      macro_distribution_fats: 28,
      macro_distribution_carbohydrates: 50,
    },
    expectedRow: createMockPreferenceRow({
      diet_type: "flexitarian",
      daily_calorie_requirement: 1900,
      allergies: null,
      macro_distribution_protein: 22,
      macro_distribution_fats: 28,
      macro_distribution_carbohydrates: 50,
    }),
  },
};

// Edge case test data
export const edgeCases = {
  longText: "A".repeat(5000),
  specialCharacters: {
    diet_type: "диета с émoji 🥗 & symbols <>&",
    allergies: "орехи, café, naïve résumé",
    preferred_cuisines: "中文, العربية, русский",
  },
  extremeMacros: {
    macro_distribution_protein: 0,
    macro_distribution_fats: 0,
    macro_distribution_carbohydrates: 100,
  },
};

// Common error scenarios
export const errorScenarios = {
  insertFailed: { message: "Insert failed", code: "23505" },
  updateFailed: { message: "Update failed", code: "23502" },
  noDataFound: { code: "PGRST116", message: "No rows found" },
  tableNotExists: { code: "42P01", message: "Table does not exist" },
  connectionTimeout: {
    message: "Connection timeout",
    code: "ETIMEDOUT",
    details: "Network issue",
  },
};
