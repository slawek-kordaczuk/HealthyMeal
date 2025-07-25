import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { editRecipeSchema, type EditRecipeFormData } from "@/lib/validation/recipeSchema";
import { extractRecipeContent, formatRecipeContentForSubmission } from "@/lib/services/recipeContentService";
import type { RecipeDTO, UpdateRecipeCommand } from "@/types/types";

interface ManualEditFormProps {
  recipe: RecipeDTO;
  onSubmit: (data: UpdateRecipeCommand) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function ManualEditForm({ recipe, onSubmit, onCancel, isSubmitting }: ManualEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<EditRecipeFormData>({
    resolver: zodResolver(editRecipeSchema),
    defaultValues: {
      name: recipe.name,
      rating: recipe.rating || undefined,
      recipeContent: extractRecipeContent(recipe.recipe),
    },
    mode: "onChange",
  });

  const rating = watch("rating");
  const recipeContent = watch("recipeContent");

  const handleFormSubmit = async (data: EditRecipeFormData) => {
    const updateData: UpdateRecipeCommand = {
      name: data.name,
      rating: data.rating,
      recipe: formatRecipeContentForSubmission(data.recipeContent),
    };

    await onSubmit(updateData);
  };

  const handleRatingChange = (value: number[]) => {
    setValue("rating", value[0], { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" data-testid="manual-edit-form">
      {/* Recipe Name */}
      <div className="space-y-2" data-testid="manual-edit-name-section">
        <Label htmlFor="recipe-name">Nazwa przepisu</Label>
        <Input
          id="recipe-name"
          {...register("name")}
          placeholder="Wprowadź nazwę przepisu"
          className={errors.name ? "border-red-500" : ""}
          data-testid="manual-edit-name-input"
        />
        {errors.name && (
          <p className="text-sm text-red-600" data-testid="manual-edit-name-error">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Recipe Rating */}
      <div className="space-y-2" data-testid="manual-edit-rating-section">
        <Label htmlFor="recipe-rating">Ocena: {rating || "Brak oceny"}</Label>
        <div className="px-3">
          <Slider
            id="recipe-rating"
            min={1}
            max={10}
            step={1}
            value={[Number(rating) || 5]}
            onValueChange={handleRatingChange}
            className="w-full"
            data-testid="manual-edit-rating-slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>
        {errors.rating && (
          <p className="text-sm text-red-600" data-testid="manual-edit-rating-error">
            {errors.rating.message}
          </p>
        )}
      </div>

      {/* Recipe Content */}
      <div className="space-y-2" data-testid="manual-edit-content-section">
        <Label htmlFor="recipe-content">Zawartość przepisu</Label>
        <Textarea
          id="recipe-content"
          {...register("recipeContent")}
          placeholder="Wprowadź treść przepisu..."
          rows={12}
          className={errors.recipeContent ? "border-red-500" : ""}
          data-testid="manual-edit-content-input"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {errors.recipeContent && (
              <span className="text-red-600" data-testid="manual-edit-content-error">
                {errors.recipeContent.message}
              </span>
            )}
          </span>
          <span data-testid="manual-edit-content-counter">{recipeContent.length}/10000 znaków</span>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4" data-testid="manual-edit-form-actions">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          data-testid="manual-edit-cancel-button"
        >
          Anuluj
        </Button>
        <Button type="submit" disabled={!isValid || isSubmitting} data-testid="manual-edit-save-button">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
        </Button>
      </div>
    </form>
  );
}
