import React from "react";
import { Alert, AlertDescription } from "./ui/alert";

interface PreferencesStatusIndicatorProps {
  arePreferencesSet: boolean;
  className?: string;
}

export default function PreferencesStatusIndicator({
  arePreferencesSet,
  className = "",
}: PreferencesStatusIndicatorProps) {
  if (arePreferencesSet) {
    return null; // Don't show anything if preferences are already set
  }

  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <AlertDescription className="text-amber-800">
        <div className="flex items-center justify-between">
          <span>
            Nie masz skonfigurowanych preferencji żywieniowych. Skonfiguruj je, aby otrzymywać spersonalizowane
            przepisy.
          </span>
          <a
            href="/preferences"
            className="ml-4 inline-flex items-center px-3 py-1 text-sm font-medium text-amber-900 bg-amber-100 border border-amber-300 rounded-md hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
          >
            Skonfiguruj preferencje
          </a>
        </div>
      </AlertDescription>
    </Alert>
  );
}
