import { useState, useCallback, useEffect } from "react";
import type { EditRecipeFormViewModel } from "@/types/viewModels";
import type { RecipeDTO } from "@/types/types";
import type { Json } from "../../db/database.types";

interface FormErrors {
  name?: string;
  rating?: string;
  recipeContent?: string;
}

interface UseRecipeFormReturn {
  formData: EditRecipeFormViewModel;
  formErrors: FormErrors;
  isFormValid: boolean;
  handleInputChange: (field: keyof EditRecipeFormViewModel, value: string | number) => void;
  resetForm: (recipe?: RecipeDTO) => void;
  getFormDataForSubmit: () => { name: string; rating?: number; recipe: Json };
}

export function useRecipeForm(initialRecipe?: RecipeDTO | null): UseRecipeFormReturn {
  const [formData, setFormData] = useState<EditRecipeFormViewModel>({
    name: "",
    rating: "",
    recipeContent: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Extract recipe content from Json structure
  const extractRecipeContent = (recipe: Json): string => {
    if (typeof recipe === "object" && recipe !== null) {
      // Check for instructions field (new format)
      if ("instructions" in recipe) {
        return String(recipe.instructions);
      }
      // Check for content field (legacy format)
      if ("content" in recipe) {
        return String(recipe.content);
      }
    }
    if (typeof recipe === "string") {
      return recipe;
    }
    return "";
  };

  // Initialize form with recipe data
  useEffect(() => {
    if (initialRecipe) {
      setFormData({
        name: initialRecipe.name,
        rating: initialRecipe.rating || "",
        recipeContent: extractRecipeContent(initialRecipe.recipe),
      });
      setFormErrors({});
    }
  }, [initialRecipe]);

  const validateField = useCallback(
    (field: keyof EditRecipeFormViewModel, value: string | number): string | undefined => {
      switch (field) {
        case "name": {
          const nameValue = String(value).trim();
          if (!nameValue) {
            return "Nazwa przepisu jest wymagana";
          }
          if (nameValue.length > 255) {
            return "Nazwa przepisu nie może być dłuższa niż 255 znaków";
          }
          break;
        }

        case "rating": {
          if (value !== "" && value !== 0) {
            const ratingNum = Number(value);
            if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10) {
              return "Ocena musi być liczbą od 1 do 10";
            }
          }
          break;
        }

        case "recipeContent": {
          const contentValue = String(value).trim();
          if (!contentValue) {
            return "Zawartość przepisu jest wymagana";
          }
          if (contentValue.length < 10) {
            return "Przepis musi mieć co najmniej 10 znaków";
          }
          if (contentValue.length > 10000) {
            return "Przepis nie może być dłuższy niż 10000 znaków";
          }
          break;
        }

        default:
          break;
      }
      return undefined;
    },
    []
  );

  const handleInputChange = useCallback(
    (field: keyof EditRecipeFormViewModel, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Validate field and update errors
      const error = validateField(field, value);
      setFormErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    },
    [validateField]
  );

  const resetForm = useCallback((recipe?: RecipeDTO) => {
    if (recipe) {
      setFormData({
        name: recipe.name,
        rating: recipe.rating || "",
        recipeContent: extractRecipeContent(recipe.recipe),
      });
    } else {
      setFormData({
        name: "",
        rating: "",
        recipeContent: "",
      });
    }
    setFormErrors({});
  }, []);

  const getFormDataForSubmit = useCallback(() => {
    const rating = formData.rating === "" ? undefined : Number(formData.rating);

    return {
      name: formData.name.trim(),
      rating,
      recipe: { instructions: formData.recipeContent.trim() } as Json,
    };
  }, [formData]);

  // Check if form is valid
  const isFormValid =
    !Object.values(formErrors).some((error) => error) &&
    formData.name.trim() !== "" &&
    formData.recipeContent.trim() !== "";

  return {
    formData,
    formErrors,
    isFormValid,
    handleInputChange,
    resetForm,
    getFormDataForSubmit,
  };
}
