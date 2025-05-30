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
} from "../ui/alert-dialog";
import type { RecipeDTO } from "../../types/types";

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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Potwierdź usunięcie przepisu</AlertDialogTitle>
          <AlertDialogDescription>
            Czy na pewno chcesz usunąć przepis <span className="font-semibold">&quot;{recipeToDelete?.name}&quot;</span>
            ?
            <br />
            <br />
            Ta akcja jest nieodwracalna i przepis zostanie trwale usunięty z Twojej kolekcji.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Anuluj</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
            Usuń przepis
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
