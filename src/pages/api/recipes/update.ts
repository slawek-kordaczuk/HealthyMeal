import type { APIRoute } from "astro";
import { z } from "zod";
import type { UpdateRecipeCommand } from "../../../types/types";
import { RecipeService, RecipeNotFoundError, UnauthorizedError } from "../../../lib/services/recipeService";

export const prerender = false;

const updateRecipeSchema = z.object({
  recipeId: z.number(),
  name: z.string().min(1).max(100).optional(),
  rating: z.number().min(1).max(10).optional(),
  recipe: z.any().optional(), // Json type
});

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    // Get authenticated user from middleware
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const validation = updateRecipeSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { recipeId, ...updateData } = validation.data;
    const command = updateData as UpdateRecipeCommand;

    const recipeService = new RecipeService(locals.supabase);
    const updatedRecipe = await recipeService.updateRecipe(recipeId, locals.user.id, command);

    return new Response(JSON.stringify(updatedRecipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating recipe:", error);

    if (error instanceof RecipeNotFoundError) {
      return new Response(JSON.stringify({ error: "Recipe not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof UnauthorizedError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Failed to update recipe" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
