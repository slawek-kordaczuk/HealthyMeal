import React from "react";
import type { Control } from "react-hook-form";
import { FormFieldWrapper } from "../FormFieldWrapper";
import type { PreferencesFormValues } from "./PreferencesForm";

interface MacroDistributionSectionProps {
  control: Control<PreferencesFormValues>;
}

export function MacroDistributionSection({ control }: MacroDistributionSectionProps) {
  return (
    <div className="space-y-4" data-testid="preferences-macro-distribution-section">
      <div data-testid="preferences-macro-distribution-header">
        <h3 className="text-lg font-medium" data-testid="preferences-macro-distribution-title">
          Rozkład makroskładników (%)
        </h3>
        <p className="text-sm text-gray-600" data-testid="preferences-macro-distribution-description">
          Określ preferowany rozkład makroskładników. Suma powinna wynosić 100% (opcjonalne).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="preferences-macro-distribution-grid">
        <FormFieldWrapper
          control={control}
          name="macro_distribution_protein"
          label="Białko (%)"
          placeholder="np. 30"
          type="number"
          min="0"
          max="100"
          testId="preferences-protein"
        />

        <FormFieldWrapper
          control={control}
          name="macro_distribution_fats"
          label="Tłuszcze (%)"
          placeholder="np. 30"
          type="number"
          min="0"
          max="100"
          testId="preferences-fats"
        />

        <FormFieldWrapper
          control={control}
          name="macro_distribution_carbohydrates"
          label="Węglowodany (%)"
          placeholder="np. 40"
          type="number"
          min="0"
          max="100"
          testId="preferences-carbohydrates"
        />
      </div>
    </div>
  );
}
