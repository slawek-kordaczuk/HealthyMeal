import React from "react";
import { usePreferences } from "./hooks/usePreferences";
import PreferencesStatusIndicator from "./PreferencesStatusIndicator";
import { Alert, AlertDescription } from "./ui/alert";

export default function PreferencesDemo() {
  const { preferences, arePreferencesSet, isLoading, error, refetch } = usePreferences();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <p className="text-gray-600">Ładowanie preferencji...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Indicator */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Wskaźnik statusu preferencji</h2>
        <PreferencesStatusIndicator arePreferencesSet={arePreferencesSet} />
      </div>

      {/* Debug Information */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-3">Informacje debugowania</h2>
        <div className="bg-gray-100 p-4 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Status preferencji:</strong>{" "}
              <span className={arePreferencesSet ? "text-green-600" : "text-red-600"}>
                {arePreferencesSet ? "Skonfigurowane" : "Nie skonfigurowane"}
              </span>
            </div>
            <div>
              <strong>Ładowanie:</strong>{" "}
              <span className={isLoading ? "text-blue-600" : "text-gray-600"}>{isLoading ? "Tak" : "Nie"}</span>
            </div>
            <div>
              <strong>Błąd:</strong>{" "}
              <span className={error ? "text-red-600" : "text-green-600"}>{error || "Brak"}</span>
            </div>
            <div>
              <strong>ID preferencji:</strong> <span className="text-gray-600">{preferences?.id || "Brak"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Details */}
      {preferences && (
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-3">Szczegóły preferencji</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Typ diety:</strong> {preferences.diet_type || "Nie określono"}
              </div>
              <div>
                <strong>Kalorie dziennie:</strong> {preferences.daily_calorie_requirement || "Nie określono"}
              </div>
              <div>
                <strong>Alergie:</strong> {preferences.allergies || "Nie określono"}
              </div>
              <div>
                <strong>Nietolerancje:</strong> {preferences.food_intolerances || "Nie określono"}
              </div>
              <div>
                <strong>Preferowane kuchnie:</strong> {preferences.preferred_cuisines || "Nie określono"}
              </div>
              <div>
                <strong>Wykluczone składniki:</strong> {preferences.excluded_ingredients || "Nie określono"}
              </div>
              <div>
                <strong>Białko (%):</strong> {preferences.macro_distribution_protein || "Nie określono"}
              </div>
              <div>
                <strong>Tłuszcze (%):</strong> {preferences.macro_distribution_fats || "Nie określono"}
              </div>
              <div>
                <strong>Węglowodany (%):</strong> {preferences.macro_distribution_carbohydrates || "Nie określono"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-3">Akcje</h2>
        <div className="flex gap-4">
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Odśwież preferencje
          </button>
          <a
            href="/preferences"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-decoration-none"
          >
            Przejdź do konfiguracji
          </a>
        </div>
      </div>
    </div>
  );
}
