import type { UpdateRecipeCommand, RecipeModificationCommand, RecipeModificationResponseDTO } from "../../types/types";

/**
 * Custom error for when preferences are required for AI operations
 */
export class PreferencesRequiredError extends Error {
  constructor(message = "Preferencje użytkownika są wymagane do korzystania z AI") {
    super(message);
    this.name = "PreferencesRequiredError";
  }
}

/**
 * Custom error for authentication issues
 */
export class AuthenticationError extends Error {
  constructor(message = "Sesja wygasła, zaloguj się ponownie") {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Custom error for API failures
 */
export class RecipeApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "RecipeApiError";
  }
}

/**
 * Updates a recipe with the provided data
 */
export async function updateRecipe(recipeId: number, data: UpdateRecipeCommand): Promise<void> {
  try {
    const response = await fetch(`/api/recipes/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: recipeId, ...data }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthenticationError();
      }

      const errorText = await response.text().catch(() => "Unknown error");
      throw new RecipeApiError(`Failed to update recipe: ${errorText}`, response.status);
    }
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof RecipeApiError) {
      throw error;
    }

    // Handle network errors or other unexpected errors
    throw new RecipeApiError(
      `Network error while updating recipe: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Modifies a recipe using AI
 */
export async function modifyRecipeWithAI(recipeText: string): Promise<string> {
  try {
    const command: RecipeModificationCommand = {
      recipe_text: recipeText,
    };

    const response = await fetch("/api/recipes/modify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      if (response.status === 422) {
        throw new PreferencesRequiredError();
      }

      if (response.status === 401) {
        throw new AuthenticationError();
      }

      const errorText = await response.text().catch(() => "Unknown error");
      throw new RecipeApiError(`AI modification failed: ${errorText}`, response.status);
    }

    const data: RecipeModificationResponseDTO = await response.json();
    return data.modified_recipe;
  } catch (error) {
    if (
      error instanceof PreferencesRequiredError ||
      error instanceof AuthenticationError ||
      error instanceof RecipeApiError
    ) {
      throw error;
    }

    // Handle network errors or other unexpected errors
    throw new RecipeApiError(
      `Network error during AI modification: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
