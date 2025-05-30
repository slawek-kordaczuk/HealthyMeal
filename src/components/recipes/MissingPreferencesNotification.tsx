import React from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Info, Settings } from "lucide-react";

interface MissingPreferencesNotificationProps {
  isVisible: boolean;
  onNavigateToPreferences: () => void;
}

export default function MissingPreferencesNotification({
  isVisible,
  onNavigateToPreferences,
}: MissingPreferencesNotificationProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Info className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="text-amber-800">
          <p className="font-medium mb-1">Brak preferencji żywieniowych</p>
          <p className="text-sm">
            Aby skorzystać z modyfikacji AI, musisz najpierw skonfigurować swoje preferencje żywieniowe.
          </p>
        </div>
        <Button
          onClick={onNavigateToPreferences}
          variant="outline"
          size="sm"
          className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          <Settings className="h-4 w-4 mr-2" />
          Ustaw preferencje
        </Button>
      </AlertDescription>
    </Alert>
  );
}
