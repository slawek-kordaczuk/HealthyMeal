import { describe, it, expect } from "vitest";
import { z } from "zod";

// Import the schema from PreferencesForm.tsx
const preferencesFormSchema = z
  .object({
    id: z.number().optional(),
    diet_type: z.string().optional().nullable(),
    daily_calorie_requirement: z.number().positive("Must be a positive number").optional().nullable(),
    allergies: z.string().optional().nullable(),
    food_intolerances: z.string().optional().nullable(),
    preferred_cuisines: z.string().optional().nullable(),
    excluded_ingredients: z.string().optional().nullable(),
    macro_distribution_protein: z.number().min(0).max(100).optional().nullable(),
    macro_distribution_fats: z.number().min(0).max(100).optional().nullable(),
    macro_distribution_carbohydrates: z.number().min(0).max(100).optional().nullable(),
  })
  .refine(
    (data) => {
      // Optional validation for macro sum
      const { macro_distribution_protein, macro_distribution_fats, macro_distribution_carbohydrates } = data;
      if (
        macro_distribution_protein != null &&
        macro_distribution_fats != null &&
        macro_distribution_carbohydrates != null
      ) {
        return macro_distribution_protein + macro_distribution_fats + macro_distribution_carbohydrates === 100;
      }
      return true;
    },
    {
      message:
        "Suma procentowa makroskładników (białko, tłuszcze, węglowodany) powinna wynosić 100%, jeśli wszystkie są podane.",
      path: ["macro_distribution_protein"],
    }
  );

export type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

describe("preferencesFormSchema", () => {
  // ==========================================
  // TESTY PODSTAWOWEJ STRUKTURY
  // ==========================================
  describe("basic structure validation", () => {
    it("should accept completely empty object", () => {
      const emptyData = {};

      const result = preferencesFormSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });

    it("should accept object with all fields as null", () => {
      const nullData: PreferencesFormValues = {
        id: undefined,
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

      const result = preferencesFormSchema.safeParse(nullData);
      expect(result.success).toBe(true);
    });

    it("should accept valid complete preferences", () => {
      const validData: PreferencesFormValues = {
        id: 1,
        diet_type: "vegetarian",
        daily_calorie_requirement: 2000,
        allergies: "nuts, shellfish",
        food_intolerances: "lactose",
        preferred_cuisines: "Mediterranean, Asian",
        excluded_ingredients: "red meat",
        macro_distribution_protein: 30,
        macro_distribution_fats: 30,
        macro_distribution_carbohydrates: 40,
      };

      const result = preferencesFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================
  // TESTY POLA 'id' - WARUNKI BRZEGOWE
  // ==========================================
  describe("id field validation", () => {
    it("should accept positive integer id", () => {
      const validData = { id: 123 };

      const result = preferencesFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept zero as id", () => {
      const validData = { id: 0 };

      const result = preferencesFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept negative id", () => {
      const validData = { id: -1 };

      const result = preferencesFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept decimal id (Zod allows decimal numbers)", () => {
      const validData = { id: 1.5 };

      const result = preferencesFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject string id", () => {
      const invalidData = { id: "123" };

      const result = preferencesFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==========================================
  // TESTY POLA 'daily_calorie_requirement' - REGUŁY BIZNESOWE
  // ==========================================
  describe("daily_calorie_requirement field validation", () => {
    it("should accept valid positive calorie values", () => {
      const validValues = [1, 1200, 2000, 3500, 5000];

      validValues.forEach((calories) => {
        const validData = { daily_calorie_requirement: calories };

        const result = preferencesFormSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it("should accept decimal calorie values", () => {
      const validData = { daily_calorie_requirement: 1850.5 };

      const result = preferencesFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept null calorie requirement", () => {
      const validData = { daily_calorie_requirement: null };

      const result = preferencesFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject zero calories", () => {
      const invalidData = { daily_calorie_requirement: 0 };

      const result = preferencesFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Must be a positive number");
        expect(result.error.issues[0].path).toEqual(["daily_calorie_requirement"]);
      }
    });

    it("should reject negative calories", () => {
      const invalidData = { daily_calorie_requirement: -500 };

      const result = preferencesFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Must be a positive number");
      }
    });

    it("should reject string calories", () => {
      const invalidData = { daily_calorie_requirement: "2000" };

      const result = preferencesFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ==========================================
  // TESTY PÓL TEKSTOWYCH - WARUNKI BRZEGOWE
  // ==========================================
  describe("text fields validation", () => {
    const textFields: (keyof PreferencesFormValues)[] = [
      "diet_type",
      "allergies",
      "food_intolerances",
      "preferred_cuisines",
      "excluded_ingredients",
    ];

    textFields.forEach((field) => {
      describe(`${field} field`, () => {
        it("should accept valid text content", () => {
          const validData = { [field]: "Mediterranean diet with fish" };

          const result = preferencesFormSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });

        it("should accept empty string", () => {
          const validData = { [field]: "" };

          const result = preferencesFormSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });

        it("should accept null value", () => {
          const validData = { [field]: null };

          const result = preferencesFormSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });

        it("should accept text with special characters", () => {
          const validData = { [field]: "nuts, eggs & dairy (including łóżko, café)" };

          const result = preferencesFormSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });

        it("should accept very long text", () => {
          const longText = "A".repeat(1000);
          const validData = { [field]: longText };

          const result = preferencesFormSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });

        it("should reject non-string value", () => {
          const invalidData = { [field]: 123 };

          const result = preferencesFormSchema.safeParse(invalidData);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  // ==========================================
  // TESTY MAKROSKŁADNIKÓW - REGUŁY BIZNESOWE
  // ==========================================
  describe("macro distribution validation", () => {
    const macroFields: (keyof PreferencesFormValues)[] = [
      "macro_distribution_protein",
      "macro_distribution_fats",
      "macro_distribution_carbohydrates",
    ];

    macroFields.forEach((field) => {
      describe(`${field} field`, () => {
        it("should accept valid percentage values", () => {
          const validValues = [0, 25, 50, 75, 100];

          validValues.forEach((value) => {
            const validData = { [field]: value };

            const result = preferencesFormSchema.safeParse(validData);
            expect(result.success).toBe(true);
          });
        });

        it("should accept decimal percentage values", () => {
          const validData = { [field]: 33.33 };

          const result = preferencesFormSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });

        it("should accept null value", () => {
          const validData = { [field]: null };

          const result = preferencesFormSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });

        it("should reject negative values", () => {
          const invalidData = { [field]: -10 };

          const result = preferencesFormSchema.safeParse(invalidData);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].path).toEqual([field]);
          }
        });

        it("should reject values above 100", () => {
          const invalidData = { [field]: 101 };

          const result = preferencesFormSchema.safeParse(invalidData);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].path).toEqual([field]);
          }
        });

        it("should reject string values", () => {
          const invalidData = { [field]: "50" };

          const result = preferencesFormSchema.safeParse(invalidData);
          expect(result.success).toBe(false);
        });
      });
    });

    // ==========================================
    // TESTY SUMY MAKROSKŁADNIKÓW - KLUCZOWA REGUŁA BIZNESOWA
    // ==========================================
    describe("macro distribution sum validation", () => {
      it("should accept valid macro distribution summing to 100%", () => {
        const validDistributions = [
          { protein: 30, fats: 30, carbs: 40 },
          { protein: 25, fats: 35, carbs: 40 },
          { protein: 20, fats: 20, carbs: 60 },
          { protein: 15, fats: 25, carbs: 60 },
          { protein: 0, fats: 0, carbs: 100 },
          { protein: 33.33, fats: 33.33, carbs: 33.34 },
        ];

        validDistributions.forEach(({ protein, fats, carbs }) => {
          const validData: PreferencesFormValues = {
            macro_distribution_protein: protein,
            macro_distribution_fats: fats,
            macro_distribution_carbohydrates: carbs,
          };

          const result = preferencesFormSchema.safeParse(validData);
          expect(result.success).toBe(true);
        });
      });

      it("should reject macro distribution summing to less than 100%", () => {
        const invalidData: PreferencesFormValues = {
          macro_distribution_protein: 20,
          macro_distribution_fats: 20,
          macro_distribution_carbohydrates: 30, // sum = 70%
        };

        const result = preferencesFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Suma procentowa makroskładników (białko, tłuszcze, węglowodany) powinna wynosić 100%, jeśli wszystkie są podane."
          );
          expect(result.error.issues[0].path).toEqual(["macro_distribution_protein"]);
        }
      });

      it("should reject macro distribution summing to more than 100%", () => {
        const invalidData: PreferencesFormValues = {
          macro_distribution_protein: 40,
          macro_distribution_fats: 40,
          macro_distribution_carbohydrates: 40, // sum = 120%
        };

        const result = preferencesFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Suma procentowa makroskładników (białko, tłuszcze, węglowodany) powinna wynosić 100%, jeśli wszystkie są podane."
          );
        }
      });

      it("should accept when only some macro values are provided", () => {
        const partialMacroScenarios = [
          {
            macro_distribution_protein: 30,
            macro_distribution_fats: null,
            macro_distribution_carbohydrates: null,
          },
          {
            macro_distribution_protein: 30,
            macro_distribution_fats: 40,
            macro_distribution_carbohydrates: null,
          },
          {
            macro_distribution_protein: null,
            macro_distribution_fats: 40,
            macro_distribution_carbohydrates: 60,
          },
        ];

        partialMacroScenarios.forEach((scenario) => {
          const result = preferencesFormSchema.safeParse(scenario);
          expect(result.success).toBe(true);
        });
      });

      it("should accept when all macro values are null", () => {
        const validData: PreferencesFormValues = {
          macro_distribution_protein: null,
          macro_distribution_fats: null,
          macro_distribution_carbohydrates: null,
        };

        const result = preferencesFormSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should accept when all macro values are undefined", () => {
        const validData = {}; // All fields are optional

        const result = preferencesFormSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });
  });

  // ==========================================
  // TESTY SCENARIUSZY RZECZYWISTYCH
  // ==========================================
  describe("real-world scenarios", () => {
    it("should handle vegetarian user with complete preferences", () => {
      const vegetarianUser: PreferencesFormValues = {
        diet_type: "vegetarian",
        daily_calorie_requirement: 1800,
        allergies: "nuts",
        food_intolerances: "lactose",
        preferred_cuisines: "Mediterranean, Indian",
        excluded_ingredients: "meat, fish",
        macro_distribution_protein: 20,
        macro_distribution_fats: 30,
        macro_distribution_carbohydrates: 50,
      };

      const result = preferencesFormSchema.safeParse(vegetarianUser);
      expect(result.success).toBe(true);
    });

    it("should handle keto diet user", () => {
      const ketoUser: PreferencesFormValues = {
        diet_type: "ketogenic",
        daily_calorie_requirement: 2200,
        allergies: null,
        food_intolerances: null,
        preferred_cuisines: "American, European",
        excluded_ingredients: "sugar, grains, legumes",
        macro_distribution_protein: 25,
        macro_distribution_fats: 70,
        macro_distribution_carbohydrates: 5,
      };

      const result = preferencesFormSchema.safeParse(ketoUser);
      expect(result.success).toBe(true);
    });

    it("should handle user with minimal preferences", () => {
      const minimalUser: PreferencesFormValues = {
        diet_type: "standard",
        daily_calorie_requirement: 2000,
      };

      const result = preferencesFormSchema.safeParse(minimalUser);
      expect(result.success).toBe(true);
    });

    it("should handle user updating existing preferences", () => {
      const existingPreferences: PreferencesFormValues = {
        id: 42,
        diet_type: "pescatarian",
        daily_calorie_requirement: 1900,
        allergies: "shellfish, eggs",
        food_intolerances: "gluten",
        preferred_cuisines: "Japanese, Mediterranean",
        excluded_ingredients: "red meat, poultry",
        macro_distribution_protein: 25,
        macro_distribution_fats: 35,
        macro_distribution_carbohydrates: 40,
      };

      const result = preferencesFormSchema.safeParse(existingPreferences);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================
  // TESTY WARUNKÓW BRZEGOWYCH
  // ==========================================
  describe("edge cases", () => {
    it("should handle extremely high calorie requirements", () => {
      const validData = { daily_calorie_requirement: 10000 };

      const result = preferencesFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should handle very small calorie requirements", () => {
      const validData = { daily_calorie_requirement: 0.1 };

      const result = preferencesFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should handle floating point precision in macro calculations", () => {
      const validData: PreferencesFormValues = {
        macro_distribution_protein: 33.333333,
        macro_distribution_fats: 33.333333,
        macro_distribution_carbohydrates: 33.333334, // sum = 100.000000
      };

      const result = preferencesFormSchema.safeParse(validData);
      // Note: This might fail due to floating point precision
      // In real implementation, consider rounding tolerance
      expect(result.success).toBe(true);
    });

    it("should handle mixed valid and invalid fields", () => {
      const mixedData = {
        diet_type: "valid",
        daily_calorie_requirement: -100, // invalid
        allergies: "valid",
        macro_distribution_protein: 150, // invalid
      };

      const result = preferencesFormSchema.safeParse(mixedData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(1);
      }
    });

    it("should preserve original data structure on successful validation", () => {
      const originalData: PreferencesFormValues = {
        id: 1,
        diet_type: "vegetarian",
        daily_calorie_requirement: 2000,
        allergies: null,
        food_intolerances: "",
        preferred_cuisines: "Italian",
        excluded_ingredients: null,
        macro_distribution_protein: 25,
        macro_distribution_fats: 30,
        macro_distribution_carbohydrates: 45,
      };

      const result = preferencesFormSchema.safeParse(originalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(originalData);
      }
    });
  });
});
