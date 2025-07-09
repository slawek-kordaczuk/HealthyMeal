import { describe, it, expect } from "vitest";
import {
  extractRecipeContent,
  formatRecipeContentForSubmission,
  validateRecipeContentForAI,
} from "../recipeContentService";
import type { Json } from "../../../db/database.types";

describe("RecipeContentService", () => {
  describe("extractRecipeContent", () => {
    it("should extract content from instructions field (new format)", () => {
      const recipe: Json = { instructions: "Test recipe instructions" };
      const result = extractRecipeContent(recipe);
      expect(result).toBe("Test recipe instructions");
    });

    it("should extract content from content field (legacy format)", () => {
      const recipe: Json = { content: "Test recipe content" };
      const result = extractRecipeContent(recipe);
      expect(result).toBe("Test recipe content");
    });

    it("should prioritize instructions over content field", () => {
      const recipe: Json = {
        instructions: "New instructions",
        content: "Old content",
      };
      const result = extractRecipeContent(recipe);
      expect(result).toBe("New instructions");
    });

    it("should handle string format recipe", () => {
      const recipe: Json = "Simple string recipe";
      const result = extractRecipeContent(recipe);
      expect(result).toBe("Simple string recipe");
    });

    it("should return empty string for null", () => {
      const recipe: Json = null;
      const result = extractRecipeContent(recipe);
      expect(result).toBe("");
    });
  });

  describe("formatRecipeContentForSubmission", () => {
    it("should format content with instructions field", () => {
      const content = "Test recipe content";
      const result = formatRecipeContentForSubmission(content);
      expect(result).toEqual({ instructions: "Test recipe content" });
    });

    it("should trim whitespace from content", () => {
      const content = "  Test recipe content  ";
      const result = formatRecipeContentForSubmission(content);
      expect(result).toEqual({ instructions: "Test recipe content" });
    });
  });

  describe("validateRecipeContentForAI", () => {
    it("should return valid for content with sufficient length", () => {
      const content = "A".repeat(150);
      const result = validateRecipeContentForAI(content);
      expect(result).toEqual({ isValid: true });
    });

    it("should return invalid for content too short", () => {
      const content = "A".repeat(50);
      const result = validateRecipeContentForAI(content);
      expect(result).toEqual({
        isValid: false,
        error: "Tekst przepisu musi mieć co najmniej 100 znaków.",
      });
    });
  });
});
