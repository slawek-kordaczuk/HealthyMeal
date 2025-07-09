import { z } from "zod";

export const editRecipeSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa przepisu jest wymagana")
    .max(255, "Nazwa przepisu nie może być dłuższa niż 255 znaków")
    .trim(),
  rating: z.number().min(1, "Ocena musi być liczbą od 1 do 10").max(10, "Ocena musi być liczbą od 1 do 10").optional(),
  recipeContent: z
    .string()
    .min(10, "Przepis musi mieć co najmniej 10 znaków")
    .max(10000, "Przepis nie może być dłuższy niż 10000 znaków")
    .trim(),
});

export type EditRecipeFormData = z.infer<typeof editRecipeSchema>;

// Schema for AI modification - has different validation rules
export const aiRecipeModificationSchema = z.object({
  recipeText: z
    .string()
    .min(100, "Tekst przepisu musi mieć co najmniej 100 znaków")
    .max(10000, "Tekst przepisu nie może być dłuższy niż 10000 znaków"),
});

export type AIRecipeModificationData = z.infer<typeof aiRecipeModificationSchema>;
