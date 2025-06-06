import type { GetRecipesQuery, RecipeDTO, CreateRecipeCommand, UpdateRecipeCommand } from "../../types/types";
import type { Json, Database } from "../../db/database.types";
import type { SupabaseClient } from "../../db/supabase.client";

export class RecipeNotFoundError extends Error {
  constructor(recipeId: number) {
    super(`Recipe with ID ${recipeId} not found`);
    this.name = "RecipeNotFoundError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message?: string) {
    super(message || "User is not authorized to perform this action");
    this.name = "UnauthorizedError";
  }
}

type RecipeModification = Database["public"]["Tables"]["recipe_modifications"]["Insert"];
type RecipeStatistics = Database["public"]["Tables"]["recipe_statistics"]["Insert"];
type RecipeInsert = Database["public"]["Tables"]["recipes"]["Insert"];
type RecipeUpdate = Database["public"]["Tables"]["recipes"]["Update"];

export class RecipeService {
  constructor(private readonly supabase: SupabaseClient) {}

  async getRecipes(userId: string, query: GetRecipesQuery): Promise<{ data: RecipeDTO[]; total: number }> {
    const { page = 1, limit = 20, sortBy = "created_at", order = "desc", searchTerm } = query;
    const offset = (page - 1) * limit;

    // Build the base query for counting
    let countQuery = this.supabase.from("recipes").select("*", { count: "exact", head: true }).eq("user_id", userId);

    // Build the base query for data
    let dataQuery = this.supabase.from("recipes").select("*").eq("user_id", userId);

    // Add search filter if searchTerm is provided
    if (searchTerm && searchTerm.trim()) {
      const searchFilter = `name.ilike.%${searchTerm.trim()}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    // Get total count
    const { count } = await countQuery;

    // Get paginated data with sorting
    const { data, error } = await dataQuery
      .order(sortBy, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch recipes: ${error.message}`);
    }

    return {
      data: data as RecipeDTO[],
      total: count || 0,
    };
  }

  async checkNameExists(name: string, userId: string): Promise<boolean> {
    const { data } = await this.supabase.from("recipes").select("id").eq("name", name).eq("user_id", userId).single();
    return !!data;
  }

  async createRecipe(command: CreateRecipeCommand, userId: string): Promise<RecipeDTO> {
    const insertData: RecipeInsert = {
      name: command.name,
      source: command.source,
      rating: command.rating ?? null,
      recipe: command.recipe,
      user_id: userId,
    };

    const { data, error } = await this.supabase.from("recipes").insert(insertData).select().single();

    if (error) {
      throw new Error(`Failed to create recipe: ${error.message}`);
    }

    if (!data) {
      throw new Error("Failed to create recipe: No data returned");
    }

    return data as RecipeDTO;
  }

  async updateRecipe(recipeId: number, userId: string, updateData: UpdateRecipeCommand): Promise<RecipeDTO> {
    // 1. Get the existing recipe
    const { data: existingRecipe, error: fetchError } = await this.supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .single();

    if (fetchError) {
      throw new RecipeNotFoundError(recipeId);
    }

    // 2. Verify ownership
    if (existingRecipe.user_id !== userId) {
      throw new UnauthorizedError();
    }

    // 3. Check name uniqueness if name is being updated
    if (updateData.name && updateData.name !== existingRecipe.name) {
      const { data: nameConflict } = await this.supabase
        .from("recipes")
        .select("id")
        .eq("name", updateData.name)
        .eq("user_id", userId)
        .neq("id", recipeId)
        .single();

      if (nameConflict) {
        throw new Error("You already have a recipe with this name");
      }
    }

    // 4. Prepare update data with timestamp
    const updateFields: RecipeUpdate = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    // 5. Create modification history record if recipe content is being modified
    if (updateData.recipe) {
      const modificationData: RecipeModification = {
        recipe_id: recipeId,
        user_id: userId,
        original_recipe: existingRecipe.recipe,
        modified_recipe: updateData.recipe as Json,
        ai_model: "manual", // Since this is a manual update
      };

      const { error: historyError } = await this.supabase.from("recipe_modifications").insert(modificationData);

      if (historyError) {
        console.error("Failed to create modification history:", historyError);
        throw new Error("Failed to create modification history");
      }

      // Get current statistics or create new ones
      const { data: stats } = await this.supabase
        .from("recipe_statistics")
        .select("modification_count")
        .eq("recipe_id", recipeId)
        .single();

      const statisticsData: RecipeStatistics = {
        recipe_id: recipeId,
        modification_count: (stats?.modification_count || 0) + 1,
      };

      await this.supabase.from("recipe_statistics").upsert(statisticsData);
    }

    // 6. Update the recipe
    const { data: updatedRecipe, error: updateError } = await this.supabase
      .from("recipes")
      .update(updateFields)
      .eq("id", recipeId)
      .select()
      .single();

    if (updateError) {
      throw new Error("Failed to update recipe");
    }

    return updatedRecipe as RecipeDTO;
  }

  /**
   * Deletes a recipe and all associated data (modifications, statistics)
   * Only the owner of the recipe can delete it
   */
  async deleteRecipe(recipeId: number, userId: string): Promise<void> {
    // 1. Get the existing recipe and verify ownership
    const { data: existingRecipe, error: fetchError } = await this.supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .single();

    if (fetchError || !existingRecipe) {
      throw new RecipeNotFoundError(recipeId);
    }

    // 2. Verify ownership
    if (existingRecipe.user_id !== userId) {
      throw new UnauthorizedError("Użytkownik nie jest właścicielem tego przepisu");
    }

    // 3. Delete associated data in correct order (due to foreign key constraints)

    // Delete recipe modifications first
    const { error: modificationsError } = await this.supabase
      .from("recipe_modifications")
      .delete()
      .eq("recipe_id", recipeId);

    if (modificationsError) {
      console.error("Failed to delete recipe modifications:", modificationsError);
      throw new Error("Failed to delete recipe modifications");
    }

    // Delete recipe statistics
    const { error: statisticsError } = await this.supabase.from("recipe_statistics").delete().eq("recipe_id", recipeId);

    if (statisticsError) {
      console.error("Failed to delete recipe statistics:", statisticsError);
      throw new Error("Failed to delete recipe statistics");
    }

    // 4. Finally delete the recipe itself
    const { error: deleteError } = await this.supabase.from("recipes").delete().eq("id", recipeId);

    if (deleteError) {
      console.error("Failed to delete recipe:", deleteError);
      throw new Error("Failed to delete recipe");
    }
  }
}
