import { useState, useCallback } from "react";
import {
  modifyRecipeWithAI,
  PreferencesRequiredError,
  AuthenticationError,
  RecipeApiError,
} from "../../lib/services/recipeApiService";
import { validateRecipeContentForAI } from "../../lib/services/recipeContentService";

interface AiModificationState {
  originalRecipeText: string;
  suggestedRecipeText: string | null;
  isLoadingAiSuggestion: boolean;
  aiError: string | null;
  showMissingPreferencesWarning: boolean;
}

interface UseAiRecipeModificationReturn {
  aiState: AiModificationState;
  generateSuggestion: (recipeText: string) => Promise<void>;
  approveSuggestion: () => string | null;
  rejectSuggestion: () => void;
  resetAiState: (originalText: string) => void;
}

/**
 * Hook for managing AI recipe modification state and operations.
 * Uses the new API service for cleaner separation of concerns.
 */
export function useAiRecipeModification(): UseAiRecipeModificationReturn {
  const [aiState, setAiState] = useState<AiModificationState>({
    originalRecipeText: "",
    suggestedRecipeText: null,
    isLoadingAiSuggestion: false,
    aiError: null,
    showMissingPreferencesWarning: false,
  });

  const generateSuggestion = useCallback(async (recipeText: string) => {
    // Validate recipe text before making API call
    const validation = validateRecipeContentForAI(recipeText);
    if (!validation.isValid) {
      setAiState((prev) => ({
        ...prev,
        aiError: validation.error || "Nieprawidłowy tekst przepisu",
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
      const modifiedRecipe = await modifyRecipeWithAI(recipeText);

      setAiState((prev) => ({
        ...prev,
        isLoadingAiSuggestion: false,
        suggestedRecipeText: modifiedRecipe,
        aiError: null,
        showMissingPreferencesWarning: false,
      }));
    } catch (error) {
      if (error instanceof PreferencesRequiredError) {
        setAiState((prev) => ({
          ...prev,
          isLoadingAiSuggestion: false,
          aiError: null,
          showMissingPreferencesWarning: true,
        }));
      } else if (error instanceof AuthenticationError) {
        setAiState((prev) => ({
          ...prev,
          isLoadingAiSuggestion: false,
          aiError: error.message,
          suggestedRecipeText: null,
          showMissingPreferencesWarning: false,
        }));
      } else if (error instanceof RecipeApiError) {
        setAiState((prev) => ({
          ...prev,
          isLoadingAiSuggestion: false,
          aiError: error.message,
          suggestedRecipeText: null,
          showMissingPreferencesWarning: false,
        }));
      } else {
        setAiState((prev) => ({
          ...prev,
          isLoadingAiSuggestion: false,
          aiError: "Wystąpił nieoczekiwany błąd podczas modyfikacji AI",
          suggestedRecipeText: null,
          showMissingPreferencesWarning: false,
        }));
      }
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
