import { useState, useEffect } from "react";
import type { PreferencesDTO } from "../../types/types";

interface UsePreferencesReturn {
  preferences: PreferencesDTO | null;
  arePreferencesSet: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePreferences(): UsePreferencesReturn {
  const [preferences, setPreferences] = useState<PreferencesDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch preferences from API - the API will check authentication
      const response = await fetch("/api/preferences", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 404 || (response.ok && response.status === 200)) {
        // Check if response is null (no preferences) or actual preferences
        const data = await response.json();
        setPreferences(data);
        return;
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch preferences");
      }

      const preferencesData: PreferencesDTO = await response.json();
      setPreferences(preferencesData);
    } catch (err) {
      console.error("Error fetching preferences:", err);
      if (err instanceof Error && err.message === "Unauthorized") {
        setError("Sesja wygasła. Zaloguj się ponownie.");
      } else {
        setError("Nie udało się załadować preferencji.");
      }
      setPreferences(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  // Determine if preferences are meaningfully set
  const arePreferencesSet =
    preferences !== null &&
    (preferences.diet_type ||
      preferences.daily_calorie_requirement ||
      preferences.allergies ||
      preferences.food_intolerances ||
      preferences.preferred_cuisines ||
      preferences.excluded_ingredients ||
      preferences.macro_distribution_protein ||
      preferences.macro_distribution_fats ||
      preferences.macro_distribution_carbohydrates);

  return {
    preferences,
    arePreferencesSet: Boolean(arePreferencesSet),
    isLoading,
    error,
    refetch: fetchPreferences,
  };
}
