import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { UpdateRecipeCommand } from "@/types/types";

interface UseRecipeListOperationsReturn {
  isLoading: boolean;
  updateRecipe: (recipeId: number, data: UpdateRecipeCommand) => Promise<void>;
  deleteRecipe: (recipeId: number) => Promise<void>;
}

/**
 * Custom error class for recipe API operations
 */
export class RecipeApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "RecipeApiError";
  }
}

/**
 * Hook for managing recipe CRUD operations in the recipe list.
 * Provides centralized API calls with error handling and loading states.
 * Separate from useRecipeOperations which handles AI functionality.
 */
export function useRecipeListOperations(): UseRecipeListOperationsReturn {
  const [isLoading, setIsLoading] = useState(false);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof RecipeApiError) {
      switch (error.status) {
        case 404:
          return "Nie znaleziono przepisu.";
        case 401:
          return "Sesja wygasła, zaloguj się ponownie.";
        default:
          return "Wystąpił błąd podczas operacji.";
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Wystąpił nieoczekiwany błąd.";
  };

  const updateRecipe = useCallback(async (recipeId: number, data: UpdateRecipeCommand) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/recipes/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipeId, ...data }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new RecipeApiError(response.status, errorText);
      }

      toast.success("Przepis został zaktualizowany.");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteRecipe = useCallback(async (recipeId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/recipes/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipeId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new RecipeApiError(response.status, errorText);
      }

      toast.success("Przepis został usunięty.");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    updateRecipe,
    deleteRecipe,
  };
}
