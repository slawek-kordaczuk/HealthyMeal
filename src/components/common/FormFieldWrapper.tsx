import React from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type InputType = "text" | "number" | "textarea";

interface FormFieldWrapperProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  description?: string;
  type?: InputType;
  min?: string;
  max?: string;
  testId?: string;
}

export function FormFieldWrapper<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  type = "text",
  min,
  max,
  testId,
}: FormFieldWrapperProps<T>) {
  const baseTestId = testId || `field-${name}`;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem data-testid={`${baseTestId}-field`}>
          <FormLabel data-testid={`${baseTestId}-label`}>{label}</FormLabel>
          <FormControl>
            {type === "textarea" ? (
              <Textarea
                placeholder={placeholder}
                {...field}
                value={field.value || ""}
                data-testid={`${baseTestId}-input`}
              />
            ) : (
              <Input
                type={type}
                min={min}
                max={max}
                placeholder={placeholder}
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (type === "number") {
                    field.onChange(value === "" ? null : Number(value));
                  } else {
                    field.onChange(value);
                  }
                }}
                data-testid={`${baseTestId}-input`}
              />
            )}
          </FormControl>
          {description && <FormDescription data-testid={`${baseTestId}-description`}>{description}</FormDescription>}
          <FormMessage data-testid={`${baseTestId}-error`} />
        </FormItem>
      )}
    />
  );
}
