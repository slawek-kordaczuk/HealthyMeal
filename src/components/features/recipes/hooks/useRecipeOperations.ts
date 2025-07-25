import { useState } from "react";
import type {
  CreateRecipeCommand,
  RecipeDTO,
  RecipeModificationCommand,
  RecipeModificationResponseDTO,
  RecipeFormValues,
} from "@/types/types";

interface OperationState {
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

interface AIState {
  isAIFlowActive: boolean;
  originalContentForAI: string | null;
  aiModifiedContent: string | null;
}

export const useRecipeOperations = () => {
  const [operationState, setOperationState] = useState<OperationState>({
    isLoading: false,
    error: null,
    successMessage: null,
  });

  const [aiState, setAiState] = useState<AIState>({
    isAIFlowActive: false,
    originalContentForAI: null,
    aiModifiedContent: null,
  });

  const createRecipe = async (
    values: RecipeFormValues,
    source: "manual" | "AI" = "manual",
    userId: string
  ): Promise<RecipeDTO | null> => {
    if (!userId) {
      setOperationState((prev) => ({
        ...prev,
        error: "Brak identyfikatora użytkownika. Zaloguj się ponownie.",
      }));
      return null;
    }

    try {
      setOperationState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        successMessage: null,
      }));

      // Prepare recipe content
      const recipeContent =
        source === "AI" && aiState.aiModifiedContent ? aiState.aiModifiedContent : values.recipeContent;

      const payload: CreateRecipeCommand = {
        name: values.name,
        rating: values.rating && values.rating !== "" ? Number(values.rating) : undefined,
        source,
        recipe: { instructions: recipeContent },
      };

      const response = await fetch("/api/recipes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Przepis o tej nazwie już istnieje.");
        }
        if (response.status === 401) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        throw new Error("Failed to create recipe");
      }

      const createdRecipe: RecipeDTO = await response.json();

      setOperationState((prev) => ({
        ...prev,
        isLoading: false,
        successMessage: `Przepis "${createdRecipe.name}" został pomyślnie zapisany!`,
      }));

      // Reset AI state after successful save
      setAiState({
        isAIFlowActive: false,
        originalContentForAI: null,
        aiModifiedContent: null,
      });

      return createdRecipe;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.";
      setOperationState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  };

  const modifyWithAI = async (
    values: RecipeFormValues,
    userId: string,
    arePreferencesSet: boolean
  ): Promise<{ success: boolean; needsPreferences: boolean }> => {
    if (!userId) {
      setOperationState((prev) => ({
        ...prev,
        error: "Brak identyfikatora użytkownika. Zaloguj się ponownie.",
      }));
      return { success: false, needsPreferences: false };
    }

    if (!arePreferencesSet) {
      return { success: false, needsPreferences: true };
    }

    try {
      setOperationState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        successMessage: null,
      }));

      const payload: RecipeModificationCommand = {
        recipe_text: values.recipeContent,
      };

      const response = await fetch("/api/recipes/modify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        if (response.status === 400) {
          throw new Error("Nieprawidłowe dane wejściowe. Sprawdź zawartość przepisu.");
        }
        throw new Error("Nie udało się zmodyfikować przepisu.");
      }

      const result: RecipeModificationResponseDTO = await response.json();

      setAiState({
        isAIFlowActive: true,
        originalContentForAI: values.recipeContent,
        aiModifiedContent: result.modified_recipe,
      });

      setOperationState((prev) => ({
        ...prev,
        isLoading: false,
      }));

      return { success: true, needsPreferences: false };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.";
      setOperationState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, needsPreferences: false };
    }
  };

  const rejectAIChanges = () => {
    setAiState({
      isAIFlowActive: false,
      originalContentForAI: null,
      aiModifiedContent: null,
    });
  };

  const clearMessages = () => {
    setOperationState((prev) => ({
      ...prev,
      error: null,
      successMessage: null,
    }));
  };

  return {
    isLoading: operationState.isLoading,
    error: operationState.error,
    successMessage: operationState.successMessage,
    aiState,
    createRecipe,
    modifyWithAI,
    rejectAIChanges,
    clearMessages,
  };
};
