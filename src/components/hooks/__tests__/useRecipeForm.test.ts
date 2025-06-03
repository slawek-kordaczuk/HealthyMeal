import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecipeForm } from "../useRecipeForm";
import type { RecipeDTO } from "../../../types/types";
import type { EditRecipeFormViewModel } from "../../../types/viewModels";
import type { Json } from "../../../db/database.types";

// Mock data factories
const createMockRecipe = (overrides?: Partial<RecipeDTO>): RecipeDTO => ({
  id: 1,
  name: "Test Recipe",
  rating: 5,
  source: "manual",
  recipe: { instructions: "Test instructions for the recipe" },
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const createLegacyRecipe = (): RecipeDTO => ({
  id: 2,
  name: "Legacy Recipe",
  rating: 8,
  source: "manual",
  recipe: { content: "Legacy recipe content" } as Json,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
});

describe("useRecipeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with empty form when no recipe provided", () => {
      const { result } = renderHook(() => useRecipeForm());

      expect(result.current.formData).toEqual({
        name: "",
        rating: "",
        recipeContent: "",
      });
      expect(result.current.formErrors).toEqual({});
      expect(result.current.isFormValid).toBe(false);
    });

    it("should initialize with recipe data when provided", () => {
      const mockRecipe = createMockRecipe({
        name: "Spaghetti Carbonara",
        rating: 9,
        recipe: { instructions: "Cook pasta and add eggs" },
      });

      const { result } = renderHook(() => useRecipeForm(mockRecipe));

      expect(result.current.formData).toEqual({
        name: "Spaghetti Carbonara",
        rating: 9,
        recipeContent: "Cook pasta and add eggs",
      });
      expect(result.current.formErrors).toEqual({});
      expect(result.current.isFormValid).toBe(true);
    });

    it("should handle recipe with no rating", () => {
      const mockRecipe = createMockRecipe({
        name: "Simple Recipe",
        rating: 0,
        recipe: { instructions: "Simple instructions" },
      });

      const { result } = renderHook(() => useRecipeForm(mockRecipe));

      expect(result.current.formData.rating).toBe("");
    });

    it("should handle null recipe", () => {
      const { result } = renderHook(() => useRecipeForm(null));

      expect(result.current.formData).toEqual({
        name: "",
        rating: "",
        recipeContent: "",
      });
      expect(result.current.isFormValid).toBe(false);
    });
  });

  describe("Recipe Content Extraction", () => {
    it("should extract content from instructions field (new format)", () => {
      const mockRecipe = createMockRecipe({
        recipe: { instructions: "New format instructions" },
      });

      const { result } = renderHook(() => useRecipeForm(mockRecipe));

      expect(result.current.formData.recipeContent).toBe("New format instructions");
    });

    it("should extract content from content field (legacy format)", () => {
      const legacyRecipe = createLegacyRecipe();

      const { result } = renderHook(() => useRecipeForm(legacyRecipe));

      expect(result.current.formData.recipeContent).toBe("Legacy recipe content");
    });

    it("should handle string recipe format", () => {
      const mockRecipe = createMockRecipe({
        recipe: "String recipe content" as Json,
      });

      const { result } = renderHook(() => useRecipeForm(mockRecipe));

      expect(result.current.formData.recipeContent).toBe("String recipe content");
    });

    it("should handle empty object recipe", () => {
      const mockRecipe = createMockRecipe({
        recipe: {} as Json,
      });

      const { result } = renderHook(() => useRecipeForm(mockRecipe));

      expect(result.current.formData.recipeContent).toBe("");
    });

    it("should handle null recipe content", () => {
      const mockRecipe = createMockRecipe({
        recipe: null as unknown as Json,
      });

      const { result } = renderHook(() => useRecipeForm(mockRecipe));

      expect(result.current.formData.recipeContent).toBe("");
    });

    it("should prioritize instructions over content field", () => {
      const mockRecipe = createMockRecipe({
        recipe: {
          instructions: "New instructions",
          content: "Old content",
        } as Json,
      });

      const { result } = renderHook(() => useRecipeForm(mockRecipe));

      expect(result.current.formData.recipeContent).toBe("New instructions");
    });
  });

  describe("Form Validation - Name Field", () => {
    it("should validate required name field", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("name", "");
      });

      expect(result.current.formErrors.name).toBe("Nazwa przepisu jest wymagana");
      expect(result.current.isFormValid).toBe(false);
    });

    it("should validate name field with only whitespace", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("name", "   ");
      });

      expect(result.current.formErrors.name).toBe("Nazwa przepisu jest wymagana");
      expect(result.current.isFormValid).toBe(false);
    });

    it("should accept valid name", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("name", "Valid Recipe Name");
        result.current.handleInputChange("recipeContent", "Some recipe content here");
      });

      expect(result.current.formErrors.name).toBeUndefined();
    });

    it("should validate name length limit (255 characters)", () => {
      const { result } = renderHook(() => useRecipeForm());

      const longName = "a".repeat(256);

      act(() => {
        result.current.handleInputChange("name", longName);
      });

      expect(result.current.formErrors.name).toBe("Nazwa przepisu nie może być dłuższa niż 255 znaków");
      expect(result.current.isFormValid).toBe(false);
    });

    it("should accept name at exactly 255 characters", () => {
      const { result } = renderHook(() => useRecipeForm());

      const maxLengthName = "a".repeat(255);

      act(() => {
        result.current.handleInputChange("name", maxLengthName);
        result.current.handleInputChange("recipeContent", "Some recipe content here");
      });

      expect(result.current.formErrors.name).toBeUndefined();
    });
  });

  describe("Form Validation - Rating Field", () => {
    it("should accept empty rating (optional field)", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("rating", "");
        result.current.handleInputChange("name", "Test Recipe");
        result.current.handleInputChange("recipeContent", "Test content");
      });

      expect(result.current.formErrors.rating).toBeUndefined();
      expect(result.current.isFormValid).toBe(true);
    });

    it("should accept rating of 0 (special case)", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("rating", 0);
        result.current.handleInputChange("name", "Test Recipe");
        result.current.handleInputChange("recipeContent", "Test content");
      });

      expect(result.current.formErrors.rating).toBeUndefined();
      expect(result.current.isFormValid).toBe(true);
    });

    it("should validate rating range (1-10)", () => {
      const { result } = renderHook(() => useRecipeForm());

      // Test below minimum
      act(() => {
        result.current.handleInputChange("rating", 0.5);
      });
      expect(result.current.formErrors.rating).toBe("Ocena musi być liczbą od 1 do 10");

      // Test above maximum
      act(() => {
        result.current.handleInputChange("rating", 11);
      });
      expect(result.current.formErrors.rating).toBe("Ocena musi być liczbą od 1 do 10");
    });

    it("should accept valid ratings (1-10)", () => {
      const { result } = renderHook(() => useRecipeForm());

      const validRatings = [1, 5, 10, "5", "10"];

      validRatings.forEach((rating) => {
        act(() => {
          result.current.handleInputChange("rating", rating);
          result.current.handleInputChange("name", "Test Recipe");
          result.current.handleInputChange("recipeContent", "Test content");
        });

        expect(result.current.formErrors.rating).toBeUndefined();
      });
    });

    it("should validate non-numeric rating", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("rating", "abc");
      });

      expect(result.current.formErrors.rating).toBe("Ocena musi być liczbą od 1 do 10");
    });

    it("should handle string ratings properly", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("rating", "7");
        result.current.handleInputChange("name", "Test Recipe");
        result.current.handleInputChange("recipeContent", "Test content");
      });

      expect(result.current.formErrors.rating).toBeUndefined();
      expect(result.current.isFormValid).toBe(true);
    });
  });

  describe("Form Validation - Recipe Content Field", () => {
    it("should validate required recipe content", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("recipeContent", "");
      });

      expect(result.current.formErrors.recipeContent).toBe("Zawartość przepisu jest wymagana");
      expect(result.current.isFormValid).toBe(false);
    });

    it("should validate content with only whitespace", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("recipeContent", "   ");
      });

      expect(result.current.formErrors.recipeContent).toBe("Zawartość przepisu jest wymagana");
      expect(result.current.isFormValid).toBe(false);
    });

    it("should validate minimum content length (10 characters)", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("recipeContent", "Short");
      });

      expect(result.current.formErrors.recipeContent).toBe("Przepis musi mieć co najmniej 10 znaków");
      expect(result.current.isFormValid).toBe(false);
    });

    it("should accept content at exactly 10 characters", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("recipeContent", "1234567890");
        result.current.handleInputChange("name", "Test Recipe");
      });

      expect(result.current.formErrors.recipeContent).toBeUndefined();
    });

    it("should validate maximum content length (10000 characters)", () => {
      const { result } = renderHook(() => useRecipeForm());

      const longContent = "a".repeat(10001);

      act(() => {
        result.current.handleInputChange("recipeContent", longContent);
      });

      expect(result.current.formErrors.recipeContent).toBe("Przepis nie może być dłuższy niż 10000 znaków");
      expect(result.current.isFormValid).toBe(false);
    });

    it("should accept content at exactly 10000 characters", () => {
      const { result } = renderHook(() => useRecipeForm());

      const maxLengthContent = "a".repeat(10000);

      act(() => {
        result.current.handleInputChange("recipeContent", maxLengthContent);
        result.current.handleInputChange("name", "Test Recipe");
      });

      expect(result.current.formErrors.recipeContent).toBeUndefined();
    });
  });

  describe("Form Reset Functionality", () => {
    it("should reset form to empty state when no recipe provided", () => {
      const mockRecipe = createMockRecipe();
      const { result } = renderHook(() => useRecipeForm(mockRecipe));

      // Form should be populated initially
      expect(result.current.formData.name).toBe("Test Recipe");

      // Reset without recipe
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData).toEqual({
        name: "",
        rating: "",
        recipeContent: "",
      });
      expect(result.current.formErrors).toEqual({});
      expect(result.current.isFormValid).toBe(false);
    });

    it("should reset form with new recipe data", () => {
      const { result } = renderHook(() => useRecipeForm());

      // Add some data and errors first
      act(() => {
        result.current.handleInputChange("name", "Old Name");
        result.current.handleInputChange("rating", "invalid");
      });

      expect(result.current.formErrors.rating).toBeDefined();

      // Reset with new recipe
      const newRecipe = createMockRecipe({
        name: "New Recipe Name",
        rating: 8,
        recipe: { instructions: "New instructions" },
      });

      act(() => {
        result.current.resetForm(newRecipe);
      });

      expect(result.current.formData).toEqual({
        name: "New Recipe Name",
        rating: 8,
        recipeContent: "New instructions",
      });
      expect(result.current.formErrors).toEqual({});
      expect(result.current.isFormValid).toBe(true);
    });

    it("should clear form errors on reset", () => {
      const { result } = renderHook(() => useRecipeForm());

      // Add some validation errors
      act(() => {
        result.current.handleInputChange("name", "");
        result.current.handleInputChange("rating", "invalid");
        result.current.handleInputChange("recipeContent", "short");
      });

      expect(Object.keys(result.current.formErrors)).toHaveLength(3);

      // Reset form
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formErrors).toEqual({});
    });
  });

  describe("Form Data Submission", () => {
    it("should prepare correct data for submission with all fields", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("name", "  Spaghetti Carbonara  ");
        result.current.handleInputChange("rating", "9");
        result.current.handleInputChange("recipeContent", "  Cook pasta and add eggs  ");
      });

      const submitData = result.current.getFormDataForSubmit();

      expect(submitData).toEqual({
        name: "Spaghetti Carbonara", // trimmed
        rating: 9, // converted to number
        recipe: { instructions: "Cook pasta and add eggs" }, // trimmed and wrapped
      });
    });

    it("should handle empty rating in submission", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("name", "Recipe Name");
        result.current.handleInputChange("rating", "");
        result.current.handleInputChange("recipeContent", "Recipe content");
      });

      const submitData = result.current.getFormDataForSubmit();

      expect(submitData).toEqual({
        name: "Recipe Name",
        rating: undefined, // empty string becomes undefined
        recipe: { instructions: "Recipe content" },
      });
    });

    it("should handle zero rating in submission", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("name", "Recipe Name");
        result.current.handleInputChange("rating", 0);
        result.current.handleInputChange("recipeContent", "Recipe content");
      });

      const submitData = result.current.getFormDataForSubmit();

      expect(submitData).toEqual({
        name: "Recipe Name",
        rating: 0, // zero is preserved
        recipe: { instructions: "Recipe content" },
      });
    });

    it("should trim whitespace in submission data", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("name", "   Recipe   ");
        result.current.handleInputChange("recipeContent", "   Content   ");
      });

      const submitData = result.current.getFormDataForSubmit();

      expect(submitData.name).toBe("Recipe");
      expect(submitData.recipe).toEqual({ instructions: "Content" });
    });
  });

  describe("Form Validity", () => {
    it("should be invalid with empty required fields", () => {
      const { result } = renderHook(() => useRecipeForm());

      expect(result.current.isFormValid).toBe(false);
    });

    it("should be invalid with validation errors", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("name", "Valid Name");
        result.current.handleInputChange("rating", "invalid");
        result.current.handleInputChange("recipeContent", "Valid content here");
      });

      expect(result.current.isFormValid).toBe(false);
    });

    it("should be valid with all required fields and no errors", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("name", "Valid Recipe Name");
        result.current.handleInputChange("rating", "8");
        result.current.handleInputChange("recipeContent", "This is a valid recipe content");
      });

      expect(result.current.isFormValid).toBe(true);
    });

    it("should be valid with optional rating empty", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("name", "Valid Recipe Name");
        result.current.handleInputChange("rating", "");
        result.current.handleInputChange("recipeContent", "This is a valid recipe content");
      });

      expect(result.current.isFormValid).toBe(true);
    });

    it("should become invalid when required field is cleared", () => {
      const { result } = renderHook(() => useRecipeForm());

      // Make form valid first
      act(() => {
        result.current.handleInputChange("name", "Valid Name");
        result.current.handleInputChange("recipeContent", "Valid content");
      });

      expect(result.current.isFormValid).toBe(true);

      // Clear required field
      act(() => {
        result.current.handleInputChange("name", "");
      });

      expect(result.current.isFormValid).toBe(false);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle rapid field changes", () => {
      const { result } = renderHook(() => useRecipeForm());

      act(() => {
        result.current.handleInputChange("name", "Name1");
        result.current.handleInputChange("name", "Name2");
        result.current.handleInputChange("name", "Final Name");
      });

      expect(result.current.formData.name).toBe("Final Name");
    });

    it("should handle invalid field names gracefully", () => {
      const { result } = renderHook(() => useRecipeForm());

      // This should not crash or cause issues
      act(() => {
        result.current.handleInputChange("invalidField" as keyof EditRecipeFormViewModel, "value");
      });

      expect(result.current.formData.name).toBe("");
    });

    it("should handle recipe updates after initialization", () => {
      const initialRecipe = createMockRecipe({
        name: "Initial Recipe",
        recipe: { instructions: "Initial content" },
      });

      const { result } = renderHook(() => useRecipeForm(initialRecipe));
      expect(result.current.formData.name).toBe("Initial Recipe");

      // Simulate recipe update by testing resetForm directly
      const updatedRecipe = createMockRecipe({
        name: "Updated Recipe",
        recipe: { instructions: "Updated content" },
      });

      act(() => {
        result.current.resetForm(updatedRecipe);
      });

      expect(result.current.formData.name).toBe("Updated Recipe");
      expect(result.current.formData.recipeContent).toBe("Updated content");
    });

    it("should handle empty recipe gracefully", () => {
      const { result } = renderHook(() => useRecipeForm());
      expect(result.current.formData.name).toBe("");

      // Test with empty reset
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.name).toBe("");
    });
  });

  describe("Real-world Scenarios", () => {
    it("should handle complete form workflow", () => {
      const { result } = renderHook(() => useRecipeForm());

      // User starts typing name
      act(() => {
        result.current.handleInputChange("name", "Sp");
      });
      expect(result.current.isFormValid).toBe(false);

      // User completes name
      act(() => {
        result.current.handleInputChange("name", "Spaghetti Carbonara");
      });
      expect(result.current.formErrors.name).toBeUndefined();

      // User adds invalid rating
      act(() => {
        result.current.handleInputChange("rating", "15");
      });
      expect(result.current.formErrors.rating).toBeDefined();
      expect(result.current.isFormValid).toBe(false);

      // User fixes rating
      act(() => {
        result.current.handleInputChange("rating", "9");
      });
      expect(result.current.formErrors.rating).toBeUndefined();

      // User adds content
      act(() => {
        result.current.handleInputChange("recipeContent", "Cook pasta in salted water...");
      });

      expect(result.current.isFormValid).toBe(true);

      // Get final submission data
      const submitData = result.current.getFormDataForSubmit();
      expect(submitData.name).toBe("Spaghetti Carbonara");
      expect(submitData.rating).toBe(9);
      expect(submitData.recipe).toHaveProperty("instructions");
    });

    it("should handle editing existing recipe workflow", () => {
      const existingRecipe = createMockRecipe({
        name: "Old Recipe Name",
        rating: 5,
        recipe: { instructions: "Old instructions" },
      });

      const { result } = renderHook(() => useRecipeForm(existingRecipe));

      // Form should be pre-populated and valid
      expect(result.current.isFormValid).toBe(true);
      expect(result.current.formData.name).toBe("Old Recipe Name");

      // User modifies name
      act(() => {
        result.current.handleInputChange("name", "Updated Recipe Name");
      });

      // User modifies rating
      act(() => {
        result.current.handleInputChange("rating", "8");
      });

      // User modifies content
      act(() => {
        result.current.handleInputChange("recipeContent", "Updated detailed instructions");
      });

      expect(result.current.isFormValid).toBe(true);

      const submitData = result.current.getFormDataForSubmit();
      expect(submitData.name).toBe("Updated Recipe Name");
      expect(submitData.rating).toBe(8);
      expect(submitData.recipe).toHaveProperty("instructions");
    });
  });

  describe("TypeScript Type Safety", () => {
    it("should maintain correct types for all return values", () => {
      const { result } = renderHook(() => useRecipeForm());

      // Type checking (these will fail compilation if types are wrong)
      expect(typeof result.current.formData).toBe("object");
      expect(typeof result.current.formErrors).toBe("object");
      expect(typeof result.current.isFormValid).toBe("boolean");
      expect(typeof result.current.handleInputChange).toBe("function");
      expect(typeof result.current.resetForm).toBe("function");
      expect(typeof result.current.getFormDataForSubmit).toBe("function");

      // Test return type of getFormDataForSubmit
      const submitData = result.current.getFormDataForSubmit();
      expect(typeof submitData.name).toBe("string");
      expect(typeof submitData.recipe).toBe("object");
      expect(submitData.recipe).toHaveProperty("instructions");
    });
  });
});
