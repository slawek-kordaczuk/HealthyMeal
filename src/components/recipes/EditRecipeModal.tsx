import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Loader2, Wand2, Check, X } from "lucide-react";
import { useRecipeForm } from "../hooks/useRecipeForm";
import { useAiRecipeModification } from "../hooks/useAiRecipeModification";
import MissingPreferencesNotification from "./MissingPreferencesNotification";
import type { RecipeDTO, UpdateRecipeCommand } from "../../types/types";
import type { Json } from "../../db/database.types";

interface EditRecipeModalProps {
  isOpen: boolean;
  recipeToEdit: RecipeDTO | null;
  onClose: () => void;
  onRecipeUpdate: (recipeId: number, data: UpdateRecipeCommand) => Promise<void>;
  preferencesAvailable: boolean;
  onNavigateToPreferences: () => void;
}

export default function EditRecipeModal({
  isOpen,
  recipeToEdit,
  onClose,
  onRecipeUpdate,
  preferencesAvailable,
  onNavigateToPreferences,
}: EditRecipeModalProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { formData, formErrors, isFormValid, handleInputChange, resetForm, getFormDataForSubmit } =
    useRecipeForm(recipeToEdit);

  const { aiState, generateSuggestion, approveSuggestion, rejectSuggestion, resetAiState } = useAiRecipeModification();

  // Extract recipe content from Json structure
  const extractRecipeContent = (recipe: Json): string => {
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
    if (typeof recipe === "string") {
      return recipe;
    }
    return "";
  };

  // Reset states when modal opens/closes or recipe changes
  useEffect(() => {
    if (isOpen && recipeToEdit) {
      resetForm(recipeToEdit);
      resetAiState(extractRecipeContent(recipeToEdit.recipe));
      setActiveTab("manual");
      setIsSubmitting(false);
    }
  }, [isOpen, recipeToEdit, resetForm, resetAiState]);

  const handleManualSave = async () => {
    if (!recipeToEdit || !isFormValid) return;

    setIsSubmitting(true);
    try {
      const updateData = getFormDataForSubmit();
      await onRecipeUpdate(recipeToEdit.id, updateData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAiSuggestion = async () => {
    if (!recipeToEdit) return;
    const recipeText = extractRecipeContent(recipeToEdit.recipe);
    await generateSuggestion(recipeText);
  };

  const handleApproveAiSuggestion = async () => {
    if (!recipeToEdit) return;

    const approvedText = approveSuggestion();
    if (!approvedText) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateRecipeCommand = {
        recipe: { instructions: approvedText } as Json,
      };
      await onRecipeUpdate(recipeToEdit.id, updateData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAiSuggestion = () => {
    rejectSuggestion();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!recipeToEdit) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edytuj przepis: {recipeToEdit.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "manual" | "ai")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Edycja ręczna</TabsTrigger>
            <TabsTrigger value="ai">Modyfikacja AI</TabsTrigger>
          </TabsList>

          {/* Manual Edit Tab */}
          <TabsContent value="manual" className="space-y-6">
            <div className="space-y-4">
              {/* Recipe Name */}
              <div className="space-y-2">
                <Label htmlFor="recipe-name">Nazwa przepisu</Label>
                <Input
                  id="recipe-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Wprowadź nazwę przepisu"
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
              </div>

              {/* Recipe Rating */}
              <div className="space-y-2">
                <Label htmlFor="recipe-rating">Ocena: {formData.rating || "Brak oceny"}</Label>
                <div className="px-3">
                  <Slider
                    id="recipe-rating"
                    min={1}
                    max={10}
                    step={1}
                    value={[Number(formData.rating) || 5]}
                    onValueChange={(value) => handleInputChange("rating", value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
                {formErrors.rating && <p className="text-sm text-red-600">{formErrors.rating}</p>}
              </div>

              {/* Recipe Content */}
              <div className="space-y-2">
                <Label htmlFor="recipe-content">Zawartość przepisu</Label>
                <Textarea
                  id="recipe-content"
                  value={formData.recipeContent}
                  onChange={(e) => handleInputChange("recipeContent", e.target.value)}
                  placeholder="Wprowadź treść przepisu..."
                  rows={12}
                  className={formErrors.recipeContent ? "border-red-500" : ""}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {formErrors.recipeContent && <span className="text-red-600">{formErrors.recipeContent}</span>}
                  </span>
                  <span>{formData.recipeContent.length}/10000 znaków</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Anuluj
              </Button>
              <Button onClick={handleManualSave} disabled={!isFormValid || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Zapisz zmiany
              </Button>
            </div>
          </TabsContent>

          {/* AI Modification Tab */}
          <TabsContent value="ai" className="space-y-6">
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

            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Zamknij
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
