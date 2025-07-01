import type { Json } from "../../db/database.types";

/**
 * Extracts recipe content from various JSON structures.
 * Supports both legacy 'content' field and new 'instructions' field.
 */
export function extractRecipeContent(recipe: Json): string {
  if (typeof recipe === "object" && recipe !== null) {
    // Check for instructions field (new format)
    if ("instructions" in recipe) {
      return String(recipe.instructions);
    }
    // Check for content field (legacy format)
    if ("content" in recipe) {
      return String(recipe.content);
    }
  }

  // Handle string format (fallback)
  if (typeof recipe === "string") {
    return recipe;
  }

  return "";
}

/**
 * Formats recipe content for API submission.
 * Always uses the new 'instructions' format.
 */
export function formatRecipeContentForSubmission(content: string): Json {
  return { instructions: content.trim() } as Json;
}

/**
 * Validates recipe content length for AI modification.
 */
export function validateRecipeContentForAI(content: string): { isValid: boolean; error?: string } {
  const trimmedContent = content.trim();

  if (trimmedContent.length < 100) {
    return {
      isValid: false,
      error: "Tekst przepisu musi mieć co najmniej 100 znaków.",
    };
  }

  if (trimmedContent.length > 10000) {
    return {
      isValid: false,
      error: "Tekst przepisu nie może być dłuższy niż 10000 znaków.",
    };
  }

  return { isValid: true };
}
