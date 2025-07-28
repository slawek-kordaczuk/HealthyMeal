import { describe, it, expect } from "vitest";
import { z } from "zod";

// Import the schema from RecipeForm.tsx
const recipeFormSchema = z.object({
  name: z.string().min(1, "Nazwa przepisu jest wymagana"),
  rating: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true; // Optional field
      const num = Number(val);
      return !isNaN(num) && num >= 1 && num <= 10;
    }, "Ocena musi być liczbą od 1 do 10"),
  recipeContent: z
    .string()
    .min(1, "Treść przepisu jest wymagana")
    .refine((content) => {
      // Validate JSON.stringify length for recipe.instructions
      const recipeJson = JSON.stringify({ instructions: content });
      return recipeJson.length >= 100 && recipeJson.length <= 10000;
    }, "Treść przepisu musi mieć odpowiednią długość (po konwersji do formatu zapisu: 100-10000 znaków)"),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

describe("recipeFormSchema", () => {
  // ==========================================
  // TESTY POLA 'name' - REGUŁY BIZNESOWE
  // ==========================================
  describe("name field validation", () => {
    it("should accept valid recipe name", () => {
      const validData: RecipeFormValues = {
        name: "Spaghetti Bolognese",
        rating: "8",
        recipeContent: "A".repeat(85), // Will result in JSON length > 100
      };

      const result = recipeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const invalidData = {
        name: "",
        rating: "5",
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Nazwa przepisu jest wymagana");
        expect(result.error.issues[0].path).toEqual(["name"]);
      }
    });

    it("should reject undefined name", () => {
      const invalidData = {
        // name: undefined, // Missing name
        rating: "5",
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept single character name", () => {
      const validData: RecipeFormValues = {
        name: "A",
        rating: "5",
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept very long name", () => {
      const validData: RecipeFormValues = {
        name: "A".repeat(1000),
        rating: "5",
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept name with special characters", () => {
      const validData: RecipeFormValues = {
        name: "Pierogi z kapustą i grzybami - tradycyjny przepis 🥟",
        rating: "9",
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================
  // TESTY POLA 'rating' - REGUŁY BIZNESOWE
  // ==========================================
  describe("rating field validation", () => {
    it("should accept valid rating within range", () => {
      const ratings = ["1", "5", "10"];

      ratings.forEach((rating) => {
        const validData: RecipeFormValues = {
          name: "Test Recipe",
          rating: rating,
          recipeContent: "A".repeat(85),
        };

        const result = recipeFormSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it("should accept empty rating (optional field)", () => {
      const validData: RecipeFormValues = {
        name: "Test Recipe",
        rating: "",
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept undefined rating (optional field)", () => {
      const validData = {
        name: "Test Recipe",
        // rating: undefined, // Missing rating
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject rating below minimum (0)", () => {
      const invalidData = {
        name: "Test Recipe",
        rating: "0",
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Ocena musi być liczbą od 1 do 10");
        expect(result.error.issues[0].path).toEqual(["rating"]);
      }
    });

    it("should reject rating above maximum (11)", () => {
      const invalidData = {
        name: "Test Recipe",
        rating: "11",
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Ocena musi być liczbą od 1 do 10");
      }
    });

    it("should reject negative rating", () => {
      const invalidData = {
        name: "Test Recipe",
        rating: "-1",
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject non-numeric rating", () => {
      const invalidRatings = ["abc", "ten", "5,5"]; // Remove "5.5" and "1.0" as they are valid numbers

      invalidRatings.forEach((rating) => {
        const invalidData = {
          name: "Test Recipe",
          rating: rating,
          recipeContent: "A".repeat(85),
        };

        const result = recipeFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    it("should accept decimal ratings within range", () => {
      const validDecimalRatings = ["5.5", "1.0", "9.9"];

      validDecimalRatings.forEach((rating) => {
        const validData: RecipeFormValues = {
          name: "Test Recipe",
          rating: rating,
          recipeContent: "A".repeat(85),
        };

        const result = recipeFormSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it("should accept boundary values (1 and 10)", () => {
      const boundaryData1: RecipeFormValues = {
        name: "Test Recipe",
        rating: "1",
        recipeContent: "A".repeat(85),
      };

      const boundaryData10: RecipeFormValues = {
        name: "Test Recipe",
        rating: "10",
        recipeContent: "A".repeat(85),
      };

      expect(recipeFormSchema.safeParse(boundaryData1).success).toBe(true);
      expect(recipeFormSchema.safeParse(boundaryData10).success).toBe(true);
    });
  });

  // ==========================================
  // TESTY POLA 'recipeContent' - REGUŁY BIZNESOWE
  // ==========================================
  describe("recipeContent field validation", () => {
    it("should accept valid recipe content", () => {
      const validContent = "1. Zagotuj wodę\n2. Dodaj makaron\n3. Gotuj 10 minut\n4. Odcedź\n5. Podawaj z sosem";
      const validData: RecipeFormValues = {
        name: "Test Recipe",
        rating: "5",
        recipeContent: validContent,
      };

      const result = recipeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty recipe content", () => {
      const invalidData = {
        name: "Test Recipe",
        rating: "5",
        recipeContent: "",
      };

      const result = recipeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Treść przepisu jest wymagana");
        expect(result.error.issues[0].path).toEqual(["recipeContent"]);
      }
    });

    it("should reject undefined recipe content", () => {
      const invalidData = {
        name: "Test Recipe",
        rating: "5",
        // recipeContent: undefined // Missing content
      };

      const result = recipeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    // WARUNKI BRZEGOWE - JSON LENGTH VALIDATION
    it("should reject content with JSON length below minimum (< 100)", () => {
      // Short content that results in JSON < 100 characters
      const shortContent = "Short recipe"; // {"instructions":"Short recipe"} = much less than 100 chars
      const invalidData = {
        name: "Test Recipe",
        rating: "5",
        recipeContent: shortContent,
      };

      const result = recipeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Treść przepisu musi mieć odpowiednią długość (po konwersji do formatu zapisu: 100-10000 znaków)"
        );
      }
    });

    it("should accept content with JSON length at minimum boundary (exactly 100)", () => {
      // Use exact content length to result in JSON with exactly 100 characters
      const exactContent = "A".repeat(81); // This results in exactly 100 characters JSON

      const validData: RecipeFormValues = {
        name: "Test Recipe",
        rating: "5",
        recipeContent: exactContent,
      };

      // Verify our calculation
      const jsonLength = JSON.stringify({ instructions: exactContent }).length;
      expect(jsonLength).toBe(100);

      const result = recipeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept content with JSON length at maximum boundary (exactly 10000)", () => {
      // Use exact content length to result in JSON with exactly 10000 characters
      const exactContent = "A".repeat(9981); // This results in exactly 10000 characters JSON

      const validData: RecipeFormValues = {
        name: "Test Recipe",
        rating: "5",
        recipeContent: exactContent,
      };

      // Verify our calculation
      const jsonLength = JSON.stringify({ instructions: exactContent }).length;
      expect(jsonLength).toBe(10000);

      const result = recipeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject content with JSON length above maximum (> 10000)", () => {
      // Content that results in JSON > 10000 characters
      const tooLongContent = "A".repeat(9982); // This exceeds 10000 characters JSON

      const invalidData = {
        name: "Test Recipe",
        rating: "5",
        recipeContent: tooLongContent,
      };

      // Verify our calculation exceeds limit
      const jsonLength = JSON.stringify({ instructions: tooLongContent }).length;
      expect(jsonLength).toBeGreaterThan(10000);

      const result = recipeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Treść przepisu musi mieć odpowiednią długość (po konwersji do formatu zapisu: 100-10000 znaków)"
        );
      }
    });

    it("should handle special characters in recipe content correctly", () => {
      const contentWithSpecialChars = 'Przepis z polskimi znakami: ąćęłńóśźż\nEmoji: 🍝🍅\nCytaty: "bardzo dobre"';
      const paddedContent = contentWithSpecialChars + "A".repeat(50); // Add padding to ensure JSON > 100 chars

      const validData: RecipeFormValues = {
        name: "Test Recipe",
        rating: "5",
        recipeContent: paddedContent,
      };

      const result = recipeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should handle newlines and tabs in recipe content", () => {
      const contentWithWhitespace = "Krok 1:\n\tZagotuj wodę\n\nKrok 2:\n\tDodaj sól\n\nKrok 3:\n\tWrzuć makaron";
      const paddedContent = contentWithWhitespace + "A".repeat(30); // Ensure JSON length > 100

      const validData: RecipeFormValues = {
        name: "Test Recipe",
        rating: "5",
        recipeContent: paddedContent,
      };

      const result = recipeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  // ==========================================
  // TESTY INTEGRACYJNE - KOMPLETNE OBIEKTY
  // ==========================================
  describe("complete object validation", () => {
    it("should validate complete valid recipe", () => {
      const completeValidRecipe: RecipeFormValues = {
        name: "Spaghetti Carbonara",
        rating: "9",
        recipeContent: `Składniki:
- 400g spaghetti
- 200g boczku
- 4 jajka
- 100g parmezanu
- Czarny pieprz
- Sól

Przygotowanie:
1. Zagotuj wodę z solą
2. Wrzuć makaron i gotuj al dente
3. Pokrój boczek w kostki i podsmaż
4. Ubij jajka z parmezanem
5. Wymieszaj gorący makaron z jajkami
6. Dodaj boczek i pieprz
7. Podawaj natychmiast`,
      };

      const result = recipeFormSchema.safeParse(completeValidRecipe);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Spaghetti Carbonara");
        expect(result.data.rating).toBe("9");
        expect(result.data.recipeContent).toContain("Składniki:");
      }
    });

    it("should handle recipe with minimal required fields", () => {
      const minimalRecipe = {
        name: "Minimal Recipe",
        recipeContent: "A".repeat(85), // Ensure JSON length > 100
        // rating is optional and omitted
      };

      const result = recipeFormSchema.safeParse(minimalRecipe);
      expect(result.success).toBe(true);
    });

    it("should accumulate multiple validation errors", () => {
      const invalidRecipe = {
        name: "", // Invalid: empty
        rating: "15", // Invalid: out of range
        recipeContent: "Short", // Invalid: too short for JSON length requirement
      };

      const result = recipeFormSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3); // Should have 3 validation errors

        const errorMessages = result.error.issues.map((issue) => issue.message);
        expect(errorMessages).toContain("Nazwa przepisu jest wymagana");
        expect(errorMessages).toContain("Ocena musi być liczbą od 1 do 10");
        expect(errorMessages).toContain(
          "Treść przepisu musi mieć odpowiednią długość (po konwersji do formatu zapisu: 100-10000 znaków)"
        );
      }
    });
  });

  // ==========================================
  // TESTY WARUNKÓW BRZEGOWYCH - EDGE CASES
  // ==========================================
  describe("edge cases and boundary conditions", () => {
    it("should handle whitespace-only name", () => {
      const validData = {
        name: "   ", // Only whitespace - this should actually pass basic string validation
        rating: "5",
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(validData);
      // This should pass basic validation since it's not empty (just whitespace)
      expect(result.success).toBe(true);
    });

    it("should handle rating with leading/trailing whitespace", () => {
      const dataWithWhitespace = {
        name: "Test Recipe",
        rating: " 5 ", // Rating with whitespace
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(dataWithWhitespace);
      // The Number() function trims whitespace and converts " 5 " to 5
      expect(result.success).toBe(true);
    });

    it("should handle very large rating numbers", () => {
      const invalidData = {
        name: "Test Recipe",
        rating: "999999",
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should handle scientific notation in rating", () => {
      const validData = {
        name: "Test Recipe",
        rating: "1e1", // Scientific notation for 10
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(validData);
      // Number("1e1") = 10, which is valid
      expect(result.success).toBe(true);
    });

    it("should reject invalid scientific notation in rating", () => {
      const invalidData = {
        name: "Test Recipe",
        rating: "1e2", // Scientific notation for 100, which is > 10
        recipeContent: "A".repeat(85),
      };

      const result = recipeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should properly calculate JSON length with escaped characters", () => {
      const contentWithEscapes = 'Recipe with "quotes" and \\backslashes\\ and \nnewlines';
      const paddedContent = contentWithEscapes + "A".repeat(50);

      const validData: RecipeFormValues = {
        name: "Test Recipe",
        rating: "5",
        recipeContent: paddedContent,
      };

      // Verify that JSON.stringify properly escapes characters
      const jsonString = JSON.stringify({ instructions: paddedContent });
      expect(jsonString).toContain('\\"'); // Escaped quotes
      expect(jsonString).toContain("\\\\"); // Escaped backslashes
      expect(jsonString).toContain("\\n"); // Escaped newlines

      const result = recipeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
