import type { APIRoute } from "astro";
import type { GetRecipesQuery, GetRecipesResponse } from "../../types/types";
import { RecipeService } from "../../lib/services/recipeService";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }): Promise<Response> => {
  try {
    // Get authenticated user from middleware
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse query parameters
    const query: GetRecipesQuery = {
      searchTerm: url.searchParams.get("searchTerm") || undefined,
      page: parseInt(url.searchParams.get("page") || "1"),
      limit: parseInt(url.searchParams.get("limit") || "10"),
      sortBy: (url.searchParams.get("sortBy") as GetRecipesQuery["sortBy"]) || "created_at",
      order: (url.searchParams.get("order") as GetRecipesQuery["order"]) || "desc",
    };

    const recipeService = new RecipeService(locals.supabase);
    const { data: recipes, total } = await recipeService.getRecipes(locals.user.id, query);

    // Calculate pagination
    const { page = 1, limit = 10 } = query;
    const totalPages = Math.ceil(total / limit);

    const response: GetRecipesResponse = {
      data: recipes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch recipes" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
