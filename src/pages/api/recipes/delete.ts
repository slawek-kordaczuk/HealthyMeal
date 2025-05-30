import { z } from "zod";
import type { APIRoute } from "astro";
import { RecipeService, RecipeNotFoundError, UnauthorizedError } from "../../../lib/services/recipeService";

export const prerender = false;

const deleteRecipeSchema = z.object({
  recipeId: z.number(),
});

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    // Get authenticated user from middleware
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const validation = deleteRecipeSchema.safeParse(body);

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

    const { recipeId } = validation.data;

    const recipeService = new RecipeService(locals.supabase);
    await recipeService.deleteRecipe(recipeId, locals.user.id);

    return new Response(JSON.stringify({ message: "Recipe deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting recipe:", error);

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

    return new Response(JSON.stringify({ error: "Failed to delete recipe" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
