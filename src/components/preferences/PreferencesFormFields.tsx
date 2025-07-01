import React from "react";
import type { Control } from "react-hook-form";
import { FormFieldWrapper } from "../FormFieldWrapper";
import type { PreferencesFormValues } from "./PreferencesForm";

interface PreferencesFormFieldsProps {
  control: Control<PreferencesFormValues>;
}

export function PreferencesFormFields({ control }: PreferencesFormFieldsProps) {
  return (
    <div className="space-y-6">
      <FormFieldWrapper
        control={control}
        name="diet_type"
        label="Typ diety"
        placeholder="np. wegetariańska, wegańska, keto"
        description="Określ swój preferowany typ diety (opcjonalne)."
        testId="preferences-diet-type"
      />

      <FormFieldWrapper
        control={control}
        name="daily_calorie_requirement"
        label="Dzienne zapotrzebowanie kaloryczne"
        placeholder="np. 2000"
        description="Twoje dzienne zapotrzebowanie kaloryczne w kcal (opcjonalne)."
        type="number"
        testId="preferences-calorie-requirement"
      />

      <FormFieldWrapper
        control={control}
        name="allergies"
        label="Alergie pokarmowe"
        placeholder="np. orzechy, skorupiaki, jaja"
        description="Wymień swoje alergie pokarmowe oddzielone przecinkami (opcjonalne)."
        type="textarea"
        testId="preferences-allergies"
      />

      <FormFieldWrapper
        control={control}
        name="food_intolerances"
        label="Nietolerancje pokarmowe"
        placeholder="np. laktoza, gluten"
        description="Wymień swoje nietolerancje pokarmowe oddzielone przecinkami (opcjonalne)."
        type="textarea"
        testId="preferences-food-intolerances"
      />

      <FormFieldWrapper
        control={control}
        name="preferred_cuisines"
        label="Preferowane kuchnie"
        placeholder="np. włoska, azjatycka, śródziemnomorska"
        description="Wymień swoje ulubione kuchnie świata oddzielone przecinkami (opcjonalne)."
        type="textarea"
        testId="preferences-preferred-cuisines"
      />

      <FormFieldWrapper
        control={control}
        name="excluded_ingredients"
        label="Wykluczone składniki"
        placeholder="np. mięso czerwone, cukier biały"
        description="Wymień składniki, których chcesz unikać oddzielone przecinkami (opcjonalne)."
        type="textarea"
        testId="preferences-excluded-ingredients"
      />
    </div>
  );
}
