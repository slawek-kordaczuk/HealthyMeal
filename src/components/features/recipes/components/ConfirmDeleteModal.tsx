import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { RecipeDTO } from "@/types/types";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  recipeToDelete: RecipeDTO | null;
  onClose: () => void;
  onConfirmDelete: (recipeId: number) => Promise<void>;
}

export default function ConfirmDeleteModal({
  isOpen,
  recipeToDelete,
  onClose,
  onConfirmDelete,
}: ConfirmDeleteModalProps) {
  const handleConfirm = async () => {
    if (recipeToDelete) {
      await onConfirmDelete(recipeToDelete.id);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent data-testid="confirm-delete-modal">
        <AlertDialogHeader>
          <AlertDialogTitle data-testid="confirm-delete-modal-title">Potwierdź usunięcie przepisu</AlertDialogTitle>
          <AlertDialogDescription data-testid="confirm-delete-modal-description">
            Czy na pewno chcesz usunąć przepis{" "}
            <span className="font-semibold" data-testid="confirm-delete-recipe-name">
              &quot;{recipeToDelete?.name}&quot;
            </span>
            ?
            <br />
            <br />
            Ta akcja jest nieodwracalna i przepis zostanie trwale usunięty z Twojej kolekcji.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter data-testid="confirm-delete-modal-footer">
          <AlertDialogCancel onClick={onClose} data-testid="confirm-delete-cancel-button">
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            data-testid="confirm-delete-confirm-button"
          >
            Usuń przepis
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
