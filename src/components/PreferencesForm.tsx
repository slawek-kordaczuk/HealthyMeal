import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { PreferencesDTO, PreferencesCommandDTO } from "../types/types";

// Shadcn/ui components
import { Button } from "./ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";

// Zod schema for form validation
const preferencesFormSchema = z
  .object({
    id: z.number().optional(),
    diet_type: z.string().optional().nullable(),
    daily_calorie_requirement: z.number().positive("Must be a positive number").optional().nullable(),
    allergies: z.string().optional().nullable(),
    food_intolerances: z.string().optional().nullable(),
    preferred_cuisines: z.string().optional().nullable(),
    excluded_ingredients: z.string().optional().nullable(),
    macro_distribution_protein: z.number().min(0).max(100).optional().nullable(),
    macro_distribution_fats: z.number().min(0).max(100).optional().nullable(),
    macro_distribution_carbohydrates: z.number().min(0).max(100).optional().nullable(),
  })
  .refine(
    (data) => {
      // Optional validation for macro sum
      const { macro_distribution_protein, macro_distribution_fats, macro_distribution_carbohydrates } = data;
      if (
        macro_distribution_protein != null &&
        macro_distribution_fats != null &&
        macro_distribution_carbohydrates != null
      ) {
        return macro_distribution_protein + macro_distribution_fats + macro_distribution_carbohydrates === 100;
      }
      return true;
    },
    {
      message:
        "Suma procentowa makroskładników (białko, tłuszcze, węglowodany) powinna wynosić 100%, jeśli wszystkie są podane.",
      path: ["macro_distribution_protein"],
    }
  );

export type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

export default function PreferencesForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [preferencesId, setPreferencesId] = useState<number | undefined>(undefined);

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      diet_type: "",
      daily_calorie_requirement: null,
      allergies: "",
      food_intolerances: "",
      preferred_cuisines: "",
      excluded_ingredients: "",
      macro_distribution_protein: null,
      macro_distribution_fats: null,
      macro_distribution_carbohydrates: null,
    },
  });

  const fetchPreferences = React.useCallback(async () => {
    try {
      const response = await fetch("/api/preferences", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 404) {
        // User has no preferences yet - this is normal for new users
        return;
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch preferences");
      }

      const preferences: PreferencesDTO = await response.json();

      // Update form with fetched preferences
      setPreferencesId(preferences.id);
      form.reset({
        id: preferences.id,
        diet_type: preferences.diet_type || "",
        daily_calorie_requirement: preferences.daily_calorie_requirement,
        allergies: preferences.allergies || "",
        food_intolerances: preferences.food_intolerances || "",
        preferred_cuisines: preferences.preferred_cuisines || "",
        excluded_ingredients: preferences.excluded_ingredients || "",
        macro_distribution_protein: preferences.macro_distribution_protein,
        macro_distribution_fats: preferences.macro_distribution_fats,
        macro_distribution_carbohydrates: preferences.macro_distribution_carbohydrates,
      });
    } catch (err) {
      console.error("Error fetching preferences:", err);
      if (err instanceof Error && err.message === "Unauthorized") {
        setError("Sesja wygasła. Zaloguj się ponownie.");
      } else {
        setError("Nie udało się załadować preferencji.");
      }
    }
  }, [form]);

  // Fetch preferences on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Since we're on a protected page, the user is already authenticated
        // The middleware ensures this component only loads for authenticated users
        // We can get the userId from the API response when fetching preferences
        await fetchPreferences();
      } catch (err) {
        console.error("Error initializing component:", err);
        setError("Wystąpił błąd podczas ładowania danych.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeComponent();
  }, [fetchPreferences]);

  const onSubmit = async (values: PreferencesFormValues) => {
    try {
      console.log("[PreferencesForm] Starting onSubmit with values:", values);
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Prepare payload - userId will be set by the server from the authenticated session
      const payload: Omit<PreferencesCommandDTO, "userId"> = {
        diet_type: values.diet_type || null,
        daily_calorie_requirement: values.daily_calorie_requirement ?? null,
        allergies: values.allergies || null,
        food_intolerances: values.food_intolerances || null,
        preferred_cuisines: values.preferred_cuisines || null,
        excluded_ingredients: values.excluded_ingredients || null,
        macro_distribution_protein: values.macro_distribution_protein ?? null,
        macro_distribution_fats: values.macro_distribution_fats ?? null,
        macro_distribution_carbohydrates: values.macro_distribution_carbohydrates ?? null,
      };

      // Include id if updating existing preferences
      if (preferencesId) {
        (payload as PreferencesCommandDTO).id = preferencesId;
      }

      console.log("[PreferencesForm] Sending payload:", payload);

      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log("[PreferencesForm] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log("[PreferencesForm] Error response:", errorData);
        if (response.status === 401) {
          throw new Error("Unauthorized");
        } else if (response.status === 403) {
          throw new Error("Forbidden");
        } else if (response.status === 400) {
          throw new Error(errorData.error || "Invalid data");
        } else {
          throw new Error("Server error");
        }
      }

      const savedPreferences: PreferencesDTO = await response.json();
      console.log("[PreferencesForm] Saved preferences:", savedPreferences);
      setPreferencesId(savedPreferences.id);
      setSuccessMessage("Preferencje zostały zapisane pomyślnie!");

      // Update form with saved data
      form.reset({
        ...values,
        id: savedPreferences.id,
      });
    } catch (err) {
      console.error("[PreferencesForm] Error saving preferences:", err);
      if (err instanceof Error) {
        if (err.message === "Unauthorized") {
          setError("Sesja wygasła. Zaloguj się ponownie.");
        } else if (err.message === "Forbidden") {
          setError("Nie masz uprawnień do wykonania tej operacji.");
        } else if (err.message === "Invalid data") {
          setError("Wprowadzone dane są nieprawidłowe. Sprawdź formularz i spróbuj ponownie.");
        } else {
          setError("Wystąpił błąd podczas zapisywania preferencji. Spróbuj ponownie później.");
        }
      } else {
        setError("Wystąpił nieoczekiwany błąd.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (error && error.includes("Sesja wygasła")) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          Musisz być zalogowany, aby skonfigurować preferencje.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Diet Type */}
          <FormField
            control={form.control}
            name="diet_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Typ diety</FormLabel>
                <FormControl>
                  <Input placeholder="np. wegetariańska, wegańska, keto" {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>Określ swój preferowany typ diety (opcjonalne).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Daily Calorie Requirement */}
          <FormField
            control={form.control}
            name="daily_calorie_requirement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dzienne zapotrzebowanie kaloryczne</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="np. 2000"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? null : Number(value));
                    }}
                  />
                </FormControl>
                <FormDescription>Twoje dzienne zapotrzebowanie kaloryczne w kcal (opcjonalne).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Allergies */}
          <FormField
            control={form.control}
            name="allergies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alergie pokarmowe</FormLabel>
                <FormControl>
                  <Textarea placeholder="np. orzechy, skorupiaki, jaja" {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>Wymień swoje alergie pokarmowe oddzielone przecinkami (opcjonalne).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Food Intolerances */}
          <FormField
            control={form.control}
            name="food_intolerances"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nietolerancje pokarmowe</FormLabel>
                <FormControl>
                  <Textarea placeholder="np. laktoza, gluten" {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>
                  Wymień swoje nietolerancje pokarmowe oddzielone przecinkami (opcjonalne).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Preferred Cuisines */}
          <FormField
            control={form.control}
            name="preferred_cuisines"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferowane kuchnie</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="np. włoska, azjatycka, śródziemnomorska"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Wymień swoje ulubione kuchnie świata oddzielone przecinkami (opcjonalne).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Excluded Ingredients */}
          <FormField
            control={form.control}
            name="excluded_ingredients"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wykluczone składniki</FormLabel>
                <FormControl>
                  <Textarea placeholder="np. mięso czerwone, cukier biały" {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>
                  Wymień składniki, których chcesz unikać oddzielone przecinkami (opcjonalne).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Macro Distribution Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Rozkład makroskładników (%)</h3>
              <p className="text-sm text-gray-600">
                Określ preferowany rozkład makroskładników. Suma powinna wynosić 100% (opcjonalne).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Protein */}
              <FormField
                control={form.control}
                name="macro_distribution_protein"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Białko (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="np. 30"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? null : Number(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fats */}
              <FormField
                control={form.control}
                name="macro_distribution_fats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tłuszcze (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="np. 30"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? null : Number(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Carbohydrates */}
              <FormField
                control={form.control}
                name="macro_distribution_carbohydrates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Węglowodany (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="np. 40"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? null : Number(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Zapisywanie..." : "Zapisz preferencje"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
