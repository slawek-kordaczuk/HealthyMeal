import type { SupabaseClient } from "../../db/supabase.client";
import type { PreferencesCommandDTO, PreferencesDTO } from "../../types/types";
import type { Database } from "../../db/database.types";

type PreferenceRow = Database["public"]["Tables"]["preferences"]["Row"];
type PreferenceInsert = Database["public"]["Tables"]["preferences"]["Insert"];
type PreferenceUpdate = Database["public"]["Tables"]["preferences"]["Update"];

export class PreferencesService {
  constructor(private readonly supabase: SupabaseClient) {}

  async createOrUpdatePreferences(data: Partial<PreferencesCommandDTO> & { userId: string }): Promise<PreferencesDTO> {
    const { userId } = data;

    // Filter out id field from preferences data
    const preferencesData = Object.fromEntries(
      Object.entries(data).filter(([key]) => key !== "id" && key !== "userId")
    );

    // Check if preferences exist for the user
    const { data: existingPreferences } = await this.supabase
      .from("preferences")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingPreferences) {
      // Update existing preferences
      const { data: updatedPreferences, error } = await this.supabase
        .from("preferences")
        .update({
          ...preferencesData,
          updated_at: new Date().toISOString(),
        } as PreferenceUpdate)
        .eq("id", existingPreferences.id)
        .select()
        .single();

      if (error) throw error;
      return this.mapToDTO(updatedPreferences);
    }

    // Create new preferences
    const { data: newPreferences, error } = await this.supabase
      .from("preferences")
      .insert({
        user_id: userId,
        ...preferencesData,
      } as PreferenceInsert)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDTO(newPreferences);
  }

  private mapToDTO(data: PreferenceRow): PreferencesDTO {
    return {
      id: data.id,
      userId: data.user_id,
      diet_type: data.diet_type,
      daily_calorie_requirement: data.daily_calorie_requirement,
      allergies: data.allergies,
      food_intolerances: data.food_intolerances,
      preferred_cuisines: data.preferred_cuisines,
      excluded_ingredients: data.excluded_ingredients,
      macro_distribution_protein: data.macro_distribution_protein,
      macro_distribution_fats: data.macro_distribution_fats,
      macro_distribution_carbohydrates: data.macro_distribution_carbohydrates,
    };
  }

  async getUserPreferences(userId: string): Promise<PreferencesDTO | null> {
    const { data, error } = await this.supabase.from("preferences").select("*").eq("user_id", userId).single();

    // If no data found, return null (not an error)
    if (error && error.code === "PGRST116") {
      return null;
    }

    if (error) {
      throw new Error(`Failed to fetch preferences: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Map database response to DTO
    return {
      id: data.id,
      userId: data.user_id,
      diet_type: data.diet_type,
      daily_calorie_requirement: data.daily_calorie_requirement,
      allergies: data.allergies,
      food_intolerances: data.food_intolerances,
      preferred_cuisines: data.preferred_cuisines,
      excluded_ingredients: data.excluded_ingredients,
      macro_distribution_protein: data.macro_distribution_protein,
      macro_distribution_fats: data.macro_distribution_fats,
      macro_distribution_carbohydrates: data.macro_distribution_carbohydrates,
    };
  }
}
