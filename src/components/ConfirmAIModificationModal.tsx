import React from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

interface ConfirmAIModificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToPreferences: () => void;
}

export default function ConfirmAIModificationModal({
  isOpen,
  onClose,
  onGoToPreferences,
}: ConfirmAIModificationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} data-testid="confirm-ai-modification-modal">
      <DialogContent className="sm:max-w-[425px]" data-testid="confirm-ai-modification-modal-content">
        <DialogHeader data-testid="confirm-ai-modification-modal-header">
          <DialogTitle data-testid="confirm-ai-modification-modal-title">Wymagane preferencje żywieniowe</DialogTitle>
          <DialogDescription data-testid="confirm-ai-modification-modal-description">
            Aby skorzystać z modyfikacji przepisu przez sztuczną inteligencję, musisz najpierw skonfigurować swoje
            preferencje żywieniowe.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4" data-testid="confirm-ai-modification-modal-body">
          <p className="text-sm text-gray-600" data-testid="confirm-ai-modification-modal-explanation">
            Preferencje żywieniowe pozwalają AI dostosować przepis do Twoich indywidualnych potrzeb, uwzględniając
            dietę, alergie, nietolerancje pokarmowe i inne wymagania.
          </p>
        </div>

        <DialogFooter data-testid="confirm-ai-modification-modal-footer">
          <Button variant="outline" onClick={onClose} data-testid="confirm-ai-modification-modal-cancel-button">
            Anuluj
          </Button>
          <Button onClick={onGoToPreferences} data-testid="confirm-ai-modification-modal-go-to-preferences-button">
            Przejdź do preferencji
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
