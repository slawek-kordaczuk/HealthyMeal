import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEditRecipeModal } from "../hooks/useEditRecipeModal";
import ManualEditForm from "./ManualEditForm";
import AIModificationPanel from "./AIModificationPanel";
import type { RecipeDTO, UpdateRecipeCommand } from "@/types/types";

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
  const { activeTab, isSubmitting, setIsSubmitting, handleTabChange } = useEditRecipeModal();

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      handleTabChange("manual");
    }
  }, [isOpen, handleTabChange]);

  const handleFormSubmit = async (data: UpdateRecipeCommand) => {
    if (!recipeToEdit) return;

    setIsSubmitting(true);
    try {
      await onRecipeUpdate(recipeToEdit.id, data);
      onClose();
    } catch (error) {
      // Error handling is already done in the parent component
      console.error("Failed to update recipe:", error);
    } finally {
      setIsSubmitting(false);
    }
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="edit-recipe-modal">
        <DialogHeader data-testid="edit-recipe-modal-header">
          <DialogTitle data-testid="edit-recipe-modal-title">Edytuj przepis: {recipeToEdit.name}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => handleTabChange(value as "manual" | "ai")}
          data-testid="edit-recipe-modal-tabs"
        >
          <TabsList className="grid w-full grid-cols-2" data-testid="edit-recipe-modal-tabs-list">
            <TabsTrigger value="manual" data-testid="edit-recipe-modal-manual-tab">
              Edycja ręczna
            </TabsTrigger>
            <TabsTrigger value="ai" data-testid="edit-recipe-modal-ai-tab">
              Modyfikacja AI
            </TabsTrigger>
          </TabsList>

          {/* Manual Edit Tab */}
          <TabsContent value="manual" data-testid="edit-recipe-modal-manual-content">
            <ManualEditForm
              recipe={recipeToEdit}
              onSubmit={handleFormSubmit}
              onCancel={handleClose}
              isSubmitting={isSubmitting}
            />
          </TabsContent>

          {/* AI Modification Tab */}
          <TabsContent value="ai" data-testid="edit-recipe-modal-ai-content">
            <AIModificationPanel
              recipe={recipeToEdit}
              onSubmit={handleFormSubmit}
              onCancel={handleClose}
              preferencesAvailable={preferencesAvailable}
              onNavigateToPreferences={onNavigateToPreferences}
              isSubmitting={isSubmitting}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
