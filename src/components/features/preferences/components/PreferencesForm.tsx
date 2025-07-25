import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Components
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AlertMessage } from "@/components/common/AlertMessage";
import { PreferencesFormFields } from "./PreferencesFormFields";
import { MacroDistributionSection } from "./MacroDistributionSection";

// Hooks
import { usePreferences } from "../hooks/usePreferences";

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

  const { isLoading, error, successMessage, fetchPreferences, savePreferences } = usePreferences({ form });

  // Fetch preferences on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        await fetchPreferences();
      } catch (err) {
        console.error("Error initializing component:", err);
      }
    };

    initializeComponent();
  }, [fetchPreferences]);

  const onSubmit = async (values: PreferencesFormValues) => {
    await savePreferences(values);
  };

  // Handle session expired error
  if (error && error.includes("Sesja wygasła")) {
    return (
      <AlertMessage
        type="error"
        message="Musisz być zalogowany, aby skonfigurować preferencje."
        testId="preferences-session-expired"
      />
    );
  }

  return (
    <div className="space-y-6" data-testid="preferences-form-container">
      {error && <AlertMessage type="error" message={error} testId="preferences-error" />}

      {successMessage && <AlertMessage type="success" message={successMessage} testId="preferences-success" />}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="preferences-form">
          <PreferencesFormFields control={form.control} />

          <MacroDistributionSection control={form.control} />

          <Button type="submit" disabled={isLoading} className="w-full" data-testid="preferences-submit-button">
            {isLoading ? "Zapisywanie..." : "Zapisz preferencje"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
