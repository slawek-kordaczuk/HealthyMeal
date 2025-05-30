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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Wymagane preferencje żywieniowe</DialogTitle>
          <DialogDescription>
            Aby skorzystać z modyfikacji przepisu przez sztuczną inteligencję, musisz najpierw skonfigurować swoje
            preferencje żywieniowe.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600">
            Preferencje żywieniowe pozwalają AI dostosować przepis do Twoich indywidualnych potrzeb, uwzględniając
            dietę, alergie, nietolerancje pokarmowe i inne wymagania.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={onGoToPreferences}>Przejdź do preferencji</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
