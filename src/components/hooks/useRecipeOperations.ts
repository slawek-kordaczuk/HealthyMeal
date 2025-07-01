import { useState } from "react";
import type {
  CreateRecipeCommand,
  RecipeDTO,
  RecipeModificationCommand,
  RecipeModificationResponseDTO,
  RecipeFormValues,
} from "../../types/types";

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

  const resetState = () => {
    setOperationState({
      isLoading: false,
      error: null,
      successMessage: null,
    });
    setAiState({
      isAIFlowActive: false,
      originalContentForAI: null,
      aiModifiedContent: null,
    });
  };

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
      console.error("Error creating recipe:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania przepisu. Spróbuj ponownie.";

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

    // Check if preferences are set
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

      // Set AI flow state
      setAiState({
        isAIFlowActive: true,
        originalContentForAI: values.recipeContent,
        aiModifiedContent: null,
      });

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
        // Try to get the error message from the response
        let errorMessage = "Failed to modify recipe with AI";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status-based message
          if (response.status === 422) {
            errorMessage = "User preferences not found. Please set your dietary preferences first.";
          } else if (response.status === 401) {
            errorMessage = "Unauthorized. Please log in again.";
          }
        }
        throw new Error(errorMessage);
      }

      const modificationResult: RecipeModificationResponseDTO = await response.json();

      setAiState((prev) => ({
        ...prev,
        aiModifiedContent: modificationResult.modified_recipe,
      }));

      setOperationState((prev) => ({
        ...prev,
        isLoading: false,
      }));

      return { success: true, needsPreferences: false };
    } catch (err) {
      console.error("Error modifying recipe with AI:", err);

      // Check if the error is related to missing preferences
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isPreferencesError =
        errorMessage.toLowerCase().includes("preferences") || errorMessage.toLowerCase().includes("not found");

      if (isPreferencesError) {
        setOperationState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Brak preferencji żywieniowych. Uzupełnij swoje preferencje, aby móc korzystać z modyfikacji AI.",
        }));
        return { success: false, needsPreferences: true };
      } else {
        // For other errors, reset AI flow
        setOperationState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie.",
        }));
        setAiState({
          isAIFlowActive: false,
          originalContentForAI: null,
          aiModifiedContent: null,
        });
        return { success: false, needsPreferences: false };
      }
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
    // State
    ...operationState,
    aiState,

    // Actions
    createRecipe,
    modifyWithAI,
    rejectAIChanges,
    resetState,
    clearMessages,
  };
};
