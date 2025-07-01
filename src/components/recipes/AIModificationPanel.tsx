import React from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Loader2, Wand2, Check, X } from "lucide-react";
import { useAiRecipeModification } from "../hooks/useAiRecipeModification";
import { extractRecipeContent, formatRecipeContentForSubmission } from "../../lib/services/recipeContentService";
import MissingPreferencesNotification from "./MissingPreferencesNotification";
import type { RecipeDTO, UpdateRecipeCommand } from "../../types/types";

interface AIModificationPanelProps {
  recipe: RecipeDTO;
  onSubmit: (data: UpdateRecipeCommand) => Promise<void>;
  onCancel: () => void;
  preferencesAvailable: boolean;
  onNavigateToPreferences: () => void;
  isSubmitting: boolean;
}

export default function AIModificationPanel({
  recipe,
  onSubmit,
  onCancel,
  preferencesAvailable,
  onNavigateToPreferences,
  isSubmitting,
}: AIModificationPanelProps) {
  const { aiState, generateSuggestion, approveSuggestion, rejectSuggestion, resetAiState } = useAiRecipeModification();

  // Initialize AI state when component mounts
  React.useEffect(() => {
    const recipeContent = extractRecipeContent(recipe.recipe);
    resetAiState(recipeContent);
  }, [recipe, resetAiState]);

  const handleGenerateAiSuggestion = async () => {
    const recipeContent = extractRecipeContent(recipe.recipe);
    await generateSuggestion(recipeContent);
  };

  const handleApproveAiSuggestion = async () => {
    const approvedText = approveSuggestion();
    if (!approvedText) return;

    const updateData: UpdateRecipeCommand = {
      recipe: formatRecipeContentForSubmission(approvedText),
    };

    await onSubmit(updateData);
  };

  const handleRejectAiSuggestion = () => {
    rejectSuggestion();
  };

  return (
    <div className="space-y-6">
      {/* Missing Preferences Warning */}
      <MissingPreferencesNotification
        isVisible={!preferencesAvailable || aiState.showMissingPreferencesWarning}
        onNavigateToPreferences={onNavigateToPreferences}
      />

      {/* Original Recipe Text */}
      <div className="space-y-2">
        <Label>Oryginalny przepis</Label>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-sm whitespace-pre-wrap">{aiState.originalRecipeText}</p>
        </div>
      </div>

      {/* Generate AI Suggestion */}
      {!aiState.suggestedRecipeText && !aiState.isLoadingAiSuggestion && (
        <div className="flex justify-center">
          <Button
            onClick={handleGenerateAiSuggestion}
            disabled={!preferencesAvailable || isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Generuj modyfikację AI
          </Button>
        </div>
      )}

      {/* Loading State */}
      {aiState.isLoadingAiSuggestion && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-lg">Generowanie modyfikacji AI...</span>
        </div>
      )}

      {/* AI Error */}
      {aiState.aiError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{aiState.aiError}</p>
        </div>
      )}

      {/* AI Suggestion */}
      {aiState.suggestedRecipeText && (
        <div className="space-y-4">
          <Label>Sugestia AI</Label>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm whitespace-pre-wrap text-green-800">{aiState.suggestedRecipeText}</p>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              onClick={handleApproveAiSuggestion}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Check className="mr-2 h-4 w-4" />
              Zatwierdź
            </Button>
            <Button variant="outline" onClick={handleRejectAiSuggestion} disabled={isSubmitting}>
              <X className="mr-2 h-4 w-4" />
              Odrzuć
            </Button>
          </div>
        </div>
      )}

      {/* Panel Actions */}
      <div className="flex justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Zamknij
        </Button>
      </div>
    </div>
  );
}
