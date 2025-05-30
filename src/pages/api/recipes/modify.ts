import type { APIRoute } from "astro";
import { z } from "zod";
import { RecipeModificationService } from "../../../lib/services/recipeModificationService";

// Disable prerendering for this API route
export const prerender = false;

const modifyRecipeSchema = z.object({
  recipe_text: z
    .string()
    .min(100, "Recipe text must be at least 100 characters")
    .max(10000, "Recipe text must not exceed 10000 characters"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get authenticated user from middleware
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const validation = modifyRecipeSchema.safeParse(body);

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

    const { recipe_text } = validation.data;

    const modificationService = new RecipeModificationService(locals.supabase);
    const result = await modificationService.modifyRecipe(recipe_text, locals.user.id);

    return new Response(JSON.stringify({ modified_recipe: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error modifying recipe:", error);

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Check for preferences-related errors
      if (errorMessage.includes("preferences not found") || errorMessage.includes("set your dietary preferences")) {
        return new Response(
          JSON.stringify({
            error: "User preferences not found. Please set your dietary preferences first.",
          }),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Check for validation errors from RecipeModificationService
      if (errorMessage.includes("recipe text cannot be empty") || errorMessage.includes("too long")) {
        return new Response(
          JSON.stringify({
            error: error.message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Check for authentication errors
      if (errorMessage.includes("authentication") || errorMessage.includes("api key")) {
        return new Response(
          JSON.stringify({
            error: "AI service authentication failed",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Default error response
    return new Response(
      JSON.stringify({
        error: "Failed to modify recipe. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
