import { useState, useCallback } from "react";
import type { AiModificationStateViewModel } from "../../types/viewModels";
import type { RecipeModificationCommand, RecipeModificationResponseDTO } from "../../types/types";

interface UseAiRecipeModificationReturn {
  aiState: AiModificationStateViewModel;
  generateSuggestion: (recipeText: string) => Promise<void>;
  approveSuggestion: () => string | null;
  rejectSuggestion: () => void;
  resetAiState: (originalText: string) => void;
}

export function useAiRecipeModification(): UseAiRecipeModificationReturn {
  const [aiState, setAiState] = useState<AiModificationStateViewModel>({
    originalRecipeText: "",
    suggestedRecipeText: null,
    isLoadingAiSuggestion: false,
    aiError: null,
    showMissingPreferencesWarning: false,
  });

  const generateSuggestion = useCallback(async (recipeText: string) => {
    // Validate recipe text length
    if (recipeText.length < 100) {
      setAiState((prev) => ({
        ...prev,
        aiError: "Tekst przepisu musi mieć co najmniej 100 znaków.",
        suggestedRecipeText: null,
        showMissingPreferencesWarning: false,
      }));
      return;
    }

    if (recipeText.length > 10000) {
      setAiState((prev) => ({
        ...prev,
        aiError: "Tekst przepisu nie może być dłuższy niż 10000 znaków.",
        suggestedRecipeText: null,
        showMissingPreferencesWarning: false,
      }));
      return;
    }

    setAiState((prev) => ({
      ...prev,
      isLoadingAiSuggestion: true,
      aiError: null,
      suggestedRecipeText: null,
      showMissingPreferencesWarning: false,
    }));

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
          // Missing preferences error
          setAiState((prev) => ({
            ...prev,
            isLoadingAiSuggestion: false,
            aiError: null,
            showMissingPreferencesWarning: true,
          }));
          return;
        }

        if (response.status === 401) {
          throw new Error("Sesja wygasła, zaloguj się ponownie.");
        }

        throw new Error("Modyfikacja AI nie powiodła się.");
      }

      const data: RecipeModificationResponseDTO = await response.json();

      setAiState((prev) => ({
        ...prev,
        isLoadingAiSuggestion: false,
        suggestedRecipeText: data.modified_recipe,
        aiError: null,
        showMissingPreferencesWarning: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.";
      setAiState((prev) => ({
        ...prev,
        isLoadingAiSuggestion: false,
        aiError: errorMessage,
        suggestedRecipeText: null,
        showMissingPreferencesWarning: false,
      }));
    }
  }, []);

  const approveSuggestion = useCallback(() => {
    return aiState.suggestedRecipeText;
  }, [aiState.suggestedRecipeText]);

  const rejectSuggestion = useCallback(() => {
    setAiState((prev) => ({
      ...prev,
      suggestedRecipeText: null,
      aiError: null,
      showMissingPreferencesWarning: false,
    }));
  }, []);

  const resetAiState = useCallback((originalText: string) => {
    setAiState({
      originalRecipeText: originalText,
      suggestedRecipeText: null,
      isLoadingAiSuggestion: false,
      aiError: null,
      showMissingPreferencesWarning: false,
    });
  }, []);

  return {
    aiState,
    generateSuggestion,
    approveSuggestion,
    rejectSuggestion,
    resetAiState,
  };
}
