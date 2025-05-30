import type { APIRoute } from "astro";
import { z } from "zod";
import type { CreateRecipeCommand } from "../../../types/types";
import { RecipeService } from "../../../lib/services/recipeService";

// Prevent static prerendering since this is a dynamic API route
export const prerender = false;

// Zod schema for validation
const createRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(100, "Recipe name is too long"),
  rating: z.number().min(1).max(10).optional(),
  source: z.enum(["manual", "AI"]),
  recipe: z.any().refine((val) => val !== undefined && val !== null, {
    message: "Recipe content is required",
  }), // Json type - can be string, object, etc.
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

    // Parse and validate the request body
    const body = await request.json();
    const validation = createRecipeSchema.safeParse(body);

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

    const command = validation.data as CreateRecipeCommand;

    // Check if recipe name already exists for this user
    const recipeService = new RecipeService(locals.supabase);
    const nameExists = await recipeService.checkNameExists(command.name);

    if (nameExists) {
      return new Response(
        JSON.stringify({
          error: "Recipe with this name already exists",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create the recipe
    const newRecipe = await recipeService.createRecipe(command, locals.user.id);

    return new Response(JSON.stringify(newRecipe), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating recipe:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create recipe",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
