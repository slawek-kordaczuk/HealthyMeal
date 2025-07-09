import { describe, it, expect } from "vitest";
import type { PreferencesCommandDTO, PreferencesDTO } from "../../../types/types";

// Extracted types from PreferencesForm for testing
export interface PreferencesFormValues {
  id?: number;
  diet_type?: string | null;
  daily_calorie_requirement?: number | null;
  allergies?: string | null;
  food_intolerances?: string | null;
  preferred_cuisines?: string | null;
  excluded_ingredients?: string | null;
  macro_distribution_protein?: number | null;
  macro_distribution_fats?: number | null;
  macro_distribution_carbohydrates?: number | null;
}

// ==========================================
// TRANSFORMACJA FORM VALUES → API PAYLOAD
// ==========================================

/**
 * Transforms form values to API payload format.
 * Business Rules:
 * - Empty strings → null (for text fields)
 * - undefined numbers → null (for numeric fields, using ??)
 * - Include preferencesId only if updating existing preferences
 */
export function transformFormValuesToPayload(
  values: PreferencesFormValues,
  preferencesId?: number
): Omit<PreferencesCommandDTO, "userId"> {
  const payload: Omit<PreferencesCommandDTO, "userId"> = {
    diet_type: values.diet_type || null,
    daily_calorie_requirement: values.daily_calorie_requirement ?? null,
    allergies: values.allergies || null,
    food_intolerances: values.food_intolerances || null,
    preferred_cuisines: values.preferred_cuisines || null,
    excluded_ingredients: values.excluded_ingredients || null,
    macro_distribution_protein: values.macro_distribution_protein ?? null,
    macro_distribution_fats: values.macro_distribution_fats ?? null,
    macro_distribution_carbohydrates: values.macro_distribution_carbohydrates ?? null,
  };

  // Include id if updating existing preferences
  if (preferencesId) {
    (payload as PreferencesCommandDTO).id = preferencesId;
  }

  return payload;
}

// ==========================================
// TRANSFORMACJA API RESPONSE → FORM VALUES
// ==========================================

/**
 * Transforms API response to form values format.
 * Business Rules:
 * - null strings → empty strings (for text input display)
 * - null numbers → null (preserved for numeric inputs)
 */
export function transformApiResponseToFormValues(preferences: PreferencesDTO): PreferencesFormValues {
  return {
    id: preferences.id,
    diet_type: preferences.diet_type || "",
    daily_calorie_requirement: preferences.daily_calorie_requirement,
    allergies: preferences.allergies || "",
    food_intolerances: preferences.food_intolerances || "",
    preferred_cuisines: preferences.preferred_cuisines || "",
    excluded_ingredients: preferences.excluded_ingredients || "",
    macro_distribution_protein: preferences.macro_distribution_protein,
    macro_distribution_fats: preferences.macro_distribution_fats,
    macro_distribution_carbohydrates: preferences.macro_distribution_carbohydrates,
  };
}

// ==========================================
// TESTY TRANSFORMACJI
// ==========================================

describe("PreferencesForm Data Transformations", () => {
  // ==========================================
  // TESTY FORM VALUES → API PAYLOAD
  // ==========================================
  describe("transformFormValuesToPayload", () => {
    it("should transform complete form values to API payload", () => {
      // Arrange
      const formValues: PreferencesFormValues = {
        diet_type: "vegetarian",
        daily_calorie_requirement: 2000,
        allergies: "nuts, shellfish",
        food_intolerances: "lactose",
        preferred_cuisines: "Mediterranean, Asian",
        excluded_ingredients: "red meat",
        macro_distribution_protein: 25,
        macro_distribution_fats: 30,
        macro_distribution_carbohydrates: 45,
      };

      // Act
      const result = transformFormValuesToPayload(formValues);

      // Assert
      expect(result).toEqual({
        diet_type: "vegetarian",
        daily_calorie_requirement: 2000,
        allergies: "nuts, shellfish",
        food_intolerances: "lactose",
        preferred_cuisines: "Mediterranean, Asian",
        excluded_ingredients: "red meat",
        macro_distribution_protein: 25,
        macro_distribution_fats: 30,
        macro_distribution_carbohydrates: 45,
      });
    });

    it("should convert empty strings to null for text fields", () => {
      // Arrange
      const formValues: PreferencesFormValues = {
        diet_type: "",
        allergies: "",
        food_intolerances: "",
        preferred_cuisines: "",
        excluded_ingredients: "",
      };

      // Act
      const result = transformFormValuesToPayload(formValues);

      // Assert
      expect(result.diet_type).toBeNull();
      expect(result.allergies).toBeNull();
      expect(result.food_intolerances).toBeNull();
      expect(result.preferred_cuisines).toBeNull();
      expect(result.excluded_ingredients).toBeNull();
    });

    it("should convert undefined numbers to null using nullish coalescing", () => {
      // Arrange
      const formValues: PreferencesFormValues = {
        diet_type: "keto",
        daily_calorie_requirement: undefined,
        macro_distribution_protein: undefined,
        macro_distribution_fats: undefined,
        macro_distribution_carbohydrates: undefined,
      };

      // Act
      const result = transformFormValuesToPayload(formValues);

      // Assert
      expect(result.daily_calorie_requirement).toBeNull();
      expect(result.macro_distribution_protein).toBeNull();
      expect(result.macro_distribution_fats).toBeNull();
      expect(result.macro_distribution_carbohydrates).toBeNull();
    });

    it("should preserve zero values for numeric fields", () => {
      // Arrange
      const formValues: PreferencesFormValues = {
        daily_calorie_requirement: 0,
        macro_distribution_protein: 0,
        macro_distribution_fats: 0,
        macro_distribution_carbohydrates: 0,
      };

      // Act
      const result = transformFormValuesToPayload(formValues);

      // Assert
      expect(result.daily_calorie_requirement).toBe(0);
      expect(result.macro_distribution_protein).toBe(0);
      expect(result.macro_distribution_fats).toBe(0);
      expect(result.macro_distribution_carbohydrates).toBe(0);
    });

    it("should handle null values correctly", () => {
      // Arrange
      const formValues: PreferencesFormValues = {
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

      // Act
      const result = transformFormValuesToPayload(formValues);

      // Assert
      expect(Object.values(result).every((value) => value === null)).toBe(true);
    });

    it("should include id when updating existing preferences", () => {
      // Arrange
      const formValues: PreferencesFormValues = {
        diet_type: "mediterranean",
      };
      const existingPreferencesId = 42;

      // Act
      const result = transformFormValuesToPayload(formValues, existingPreferencesId);

      // Assert
      expect((result as PreferencesCommandDTO).id).toBe(42);
    });

    it("should not include id when creating new preferences", () => {
      // Arrange
      const formValues: PreferencesFormValues = {
        diet_type: "paleo",
      };

      // Act
      const result = transformFormValuesToPayload(formValues);

      // Assert
      expect((result as PreferencesCommandDTO).id).toBeUndefined();
    });

    it("should handle mixed empty and valid values", () => {
      // Arrange
      const formValues: PreferencesFormValues = {
        diet_type: "flexitarian",
        daily_calorie_requirement: 1800,
        allergies: "", // empty string
        food_intolerances: "gluten",
        preferred_cuisines: "", // empty string
        excluded_ingredients: "processed foods",
        macro_distribution_protein: 25,
        macro_distribution_fats: undefined, // undefined number
        macro_distribution_carbohydrates: 60,
      };

      // Act
      const result = transformFormValuesToPayload(formValues);

      // Assert
      expect(result).toEqual({
        diet_type: "flexitarian",
        daily_calorie_requirement: 1800,
        allergies: null, // converted from empty string
        food_intolerances: "gluten",
        preferred_cuisines: null, // converted from empty string
        excluded_ingredients: "processed foods",
        macro_distribution_protein: 25,
        macro_distribution_fats: null, // converted from undefined
        macro_distribution_carbohydrates: 60,
      });
    });
  });

  // ==========================================
  // TESTY API RESPONSE → FORM VALUES
  // ==========================================
  describe("transformApiResponseToFormValues", () => {
    it("should transform complete API response to form values", () => {
      // Arrange
      const apiResponse: PreferencesDTO = {
        id: 123,
        userId: "user-456",
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

      // Act
      const result = transformApiResponseToFormValues(apiResponse);

      // Assert
      expect(result).toEqual({
        id: 123,
        diet_type: "vegetarian",
        daily_calorie_requirement: 2000,
        allergies: "nuts",
        food_intolerances: "lactose",
        preferred_cuisines: "Mediterranean",
        excluded_ingredients: "meat",
        macro_distribution_protein: 25,
        macro_distribution_fats: 30,
        macro_distribution_carbohydrates: 45,
      });
    });

    it("should convert null text fields to empty strings", () => {
      // Arrange
      const apiResponse: PreferencesDTO = {
        id: 456,
        userId: "user-789",
        diet_type: null,
        daily_calorie_requirement: 1800,
        allergies: null,
        food_intolerances: null,
        preferred_cuisines: null,
        excluded_ingredients: null,
        macro_distribution_protein: 20,
        macro_distribution_fats: 30,
        macro_distribution_carbohydrates: 50,
      };

      // Act
      const result = transformApiResponseToFormValues(apiResponse);

      // Assert
      expect(result.diet_type).toBe("");
      expect(result.allergies).toBe("");
      expect(result.food_intolerances).toBe("");
      expect(result.preferred_cuisines).toBe("");
      expect(result.excluded_ingredients).toBe("");
    });

    it("should preserve null numeric fields", () => {
      // Arrange
      const apiResponse: PreferencesDTO = {
        id: 789,
        userId: "user-abc",
        diet_type: "standard",
        daily_calorie_requirement: null,
        allergies: "",
        food_intolerances: "",
        preferred_cuisines: "",
        excluded_ingredients: "",
        macro_distribution_protein: null,
        macro_distribution_fats: null,
        macro_distribution_carbohydrates: null,
      };

      // Act
      const result = transformApiResponseToFormValues(apiResponse);

      // Assert
      expect(result.daily_calorie_requirement).toBeNull();
      expect(result.macro_distribution_protein).toBeNull();
      expect(result.macro_distribution_fats).toBeNull();
      expect(result.macro_distribution_carbohydrates).toBeNull();
    });

    it("should preserve zero values in numeric fields", () => {
      // Arrange
      const apiResponse: PreferencesDTO = {
        id: 999,
        userId: "user-def",
        diet_type: "carnivore",
        daily_calorie_requirement: 0,
        allergies: "",
        food_intolerances: "",
        preferred_cuisines: "",
        excluded_ingredients: "",
        macro_distribution_protein: 0,
        macro_distribution_fats: 0,
        macro_distribution_carbohydrates: 0,
      };

      // Act
      const result = transformApiResponseToFormValues(apiResponse);

      // Assert
      expect(result.daily_calorie_requirement).toBe(0);
      expect(result.macro_distribution_protein).toBe(0);
      expect(result.macro_distribution_fats).toBe(0);
      expect(result.macro_distribution_carbohydrates).toBe(0);
    });

    it("should handle mixed null and valid values", () => {
      // Arrange
      const apiResponse: PreferencesDTO = {
        id: 111,
        userId: "user-mixed",
        diet_type: "pescatarian",
        daily_calorie_requirement: 1900,
        allergies: null, // null text field
        food_intolerances: "shellfish",
        preferred_cuisines: null, // null text field
        excluded_ingredients: "red meat, poultry",
        macro_distribution_protein: 25,
        macro_distribution_fats: null, // null numeric field
        macro_distribution_carbohydrates: 50,
      };

      // Act
      const result = transformApiResponseToFormValues(apiResponse);

      // Assert
      expect(result).toEqual({
        id: 111,
        diet_type: "pescatarian",
        daily_calorie_requirement: 1900,
        allergies: "", // converted from null
        food_intolerances: "shellfish",
        preferred_cuisines: "", // converted from null
        excluded_ingredients: "red meat, poultry",
        macro_distribution_protein: 25,
        macro_distribution_fats: null, // preserved null
        macro_distribution_carbohydrates: 50,
      });
    });
  });

  // ==========================================
  // TESTY ROUNDTRIP TRANSFORMACJI
  // ==========================================
  describe("roundtrip transformations", () => {
    it("should preserve data through form → payload → API → form cycle", () => {
      // Arrange
      const originalFormValues: PreferencesFormValues = {
        diet_type: "mediterranean",
        daily_calorie_requirement: 2200,
        allergies: "nuts",
        food_intolerances: "dairy",
        preferred_cuisines: "Greek, Italian",
        excluded_ingredients: "processed foods",
        macro_distribution_protein: 20,
        macro_distribution_fats: 35,
        macro_distribution_carbohydrates: 45,
      };

      // Act: Form → Payload
      const payload = transformFormValuesToPayload(originalFormValues);

      // Simulate API response (add id and userId)
      const apiResponse: PreferencesDTO = {
        id: 123,
        userId: "user-test",
        ...payload,
      };

      // Act: API Response → Form
      const finalFormValues = transformApiResponseToFormValues(apiResponse);

      // Assert
      expect(finalFormValues).toEqual({
        id: 123,
        ...originalFormValues,
      });
    });

    it("should handle empty form → API → form cycle correctly", () => {
      // Arrange
      const emptyFormValues: PreferencesFormValues = {
        diet_type: "",
        daily_calorie_requirement: undefined,
        allergies: "",
        food_intolerances: "",
        preferred_cuisines: "",
        excluded_ingredients: "",
        macro_distribution_protein: undefined,
        macro_distribution_fats: undefined,
        macro_distribution_carbohydrates: undefined,
      };

      // Act: Form → Payload
      const payload = transformFormValuesToPayload(emptyFormValues);

      // Simulate API response
      const apiResponse: PreferencesDTO = {
        id: 456,
        userId: "user-empty",
        ...payload,
      };

      // Act: API Response → Form
      const finalFormValues = transformApiResponseToFormValues(apiResponse);

      // Assert
      expect(finalFormValues).toEqual({
        id: 456,
        diet_type: "",
        daily_calorie_requirement: null,
        allergies: "",
        food_intolerances: "",
        preferred_cuisines: "",
        excluded_ingredients: "",
        macro_distribution_protein: null,
        macro_distribution_fats: null,
        macro_distribution_carbohydrates: null,
      });
    });
  });

  // ==========================================
  // TESTY WARUNKÓW BRZEGOWYCH
  // ==========================================
  describe("edge cases", () => {
    it("should handle completely empty form values", () => {
      // Arrange
      const emptyValues: PreferencesFormValues = {};

      // Act
      const result = transformFormValuesToPayload(emptyValues);

      // Assert
      expect(result).toEqual({
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

    it("should handle very large numbers", () => {
      // Arrange
      const formValues: PreferencesFormValues = {
        daily_calorie_requirement: 999999,
        macro_distribution_protein: 100,
        macro_distribution_fats: 100,
        macro_distribution_carbohydrates: 100,
      };

      // Act
      const result = transformFormValuesToPayload(formValues);

      // Assert
      expect(result.daily_calorie_requirement).toBe(999999);
      expect(result.macro_distribution_protein).toBe(100);
      expect(result.macro_distribution_fats).toBe(100);
      expect(result.macro_distribution_carbohydrates).toBe(100);
    });

    it("should handle decimal numbers", () => {
      // Arrange
      const formValues: PreferencesFormValues = {
        daily_calorie_requirement: 2000.5,
        macro_distribution_protein: 33.33,
        macro_distribution_fats: 33.33,
        macro_distribution_carbohydrates: 33.34,
      };

      // Act
      const result = transformFormValuesToPayload(formValues);

      // Assert
      expect(result.daily_calorie_requirement).toBe(2000.5);
      expect(result.macro_distribution_protein).toBe(33.33);
      expect(result.macro_distribution_fats).toBe(33.33);
      expect(result.macro_distribution_carbohydrates).toBe(33.34);
    });

    it("should handle very long text values", () => {
      // Arrange
      const longText = "A".repeat(5000);
      const formValues: PreferencesFormValues = {
        diet_type: longText,
        allergies: longText,
        preferred_cuisines: longText,
      };

      // Act
      const result = transformFormValuesToPayload(formValues);

      // Assert
      expect(result.diet_type).toBe(longText);
      expect(result.allergies).toBe(longText);
      expect(result.preferred_cuisines).toBe(longText);
    });

    it("should handle special characters and Unicode", () => {
      // Arrange
      const formValues: PreferencesFormValues = {
        diet_type: "диета с émoji 🥗 & symbols <>&\"'",
        allergies: "орехи, café, naïve résumé",
        preferred_cuisines: "中文, العربية, русский",
      };

      // Act
      const result = transformFormValuesToPayload(formValues);

      // Assert
      expect(result.diet_type).toBe("диета с émoji 🥗 & symbols <>&\"'");
      expect(result.allergies).toBe("орехи, café, naïve résumé");
      expect(result.preferred_cuisines).toBe("中文, العربية, русский");
    });

    it("should handle whitespace-only strings as truthy", () => {
      // Arrange - JavaScript treats whitespace-only strings as truthy
      const formValues: PreferencesFormValues = {
        diet_type: "   ",
        allergies: "\t\n",
        food_intolerances: " \r ",
      };

      // Act
      const result = transformFormValuesToPayload(formValues);

      // Assert - whitespace strings are preserved (not converted to null)
      expect(result.diet_type).toBe("   ");
      expect(result.allergies).toBe("\t\n");
      expect(result.food_intolerances).toBe(" \r ");
    });
  });
});
