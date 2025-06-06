import type { SupabaseClient } from "../../db/supabase.client";
import type { RecipeModificationErrorCommand, PreferencesDTO } from "../../types/types";
import { PreferencesService } from "./preferencesService";
import { OpenRouterService } from "./OpenRouterService";

export class RecipeModificationService {
  private preferencesService: PreferencesService;
  private openRouterService: OpenRouterService;

  constructor(private readonly supabase: SupabaseClient) {
    this.preferencesService = new PreferencesService(supabase);

    // Initialize OpenRouter service with configuration optimized for recipe modification
    this.openRouterService = new OpenRouterService({
      defaultModel: "gpt-4o-mini",
      modelParams: {
        temperature: 0.7, // Balanced creativity for recipe modifications
        max_tokens: 2000, // Enough tokens for detailed recipe modifications
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
      },
    });

    // Set specialized system message for recipe modification
    this.openRouterService.setSystemMessage(
      `You are a professional nutritionist and chef assistant specializing in recipe modifications. 
      Your task is to modify recipes according to specific dietary preferences and restrictions.
      
      Guidelines:
      - Maintain the essence and flavor profile of the original recipe
      - Suggest appropriate ingredient substitutions based on dietary restrictions
      - Adjust portion sizes and nutritional content as needed
      - Provide clear, practical cooking instructions
      - Ensure the modified recipe is safe and nutritionally balanced
      - If a modification is not possible or safe, explain why and suggest alternatives
      
      Always respond with a complete, modified recipe in a clear, structured format.`
    );
  }

  /**
   * Modifies a recipe according to user preferences using AI
   */
  async modifyRecipe(recipeText: string, userId: string): Promise<string> {
    try {
      // Validate input
      if (!recipeText || recipeText.trim().length === 0) {
        throw new Error("Recipe text cannot be empty");
      }

      if (recipeText.length > 8000) {
        throw new Error("Recipe text is too long. Maximum 8000 characters allowed.");
      }

      // Get user preferences
      const preferences = await this.preferencesService.getUserPreferences(userId);

      if (!preferences) {
        throw new Error("User preferences not found. Please set your dietary preferences first.");
      }

      // Build detailed prompt with user preferences
      const modificationPrompt = this._buildModificationPrompt(recipeText, preferences);

      // Use OpenRouter to modify the recipe
      const response = await this.openRouterService.sendMessage(modificationPrompt, {
        temperature: 0.7,
        max_tokens: 2000,
      });

      // Extract the modified recipe from the response
      const modifiedRecipe = response.reply;

      if (!modifiedRecipe || modifiedRecipe.trim().length === 0) {
        throw new Error("AI service returned empty response");
      }

      return modifiedRecipe;
    } catch (error) {
      // Log the error with more context
      await this.logModificationError({
        recipe_text: recipeText.substring(0, 1000), // Truncate for logging
        error_code: this._getErrorCode(error),
        error_description: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }

  /**
   * Builds a detailed modification prompt based on user preferences
   */
  private _buildModificationPrompt(recipeText: string, preferences: PreferencesDTO): string {
    const preferencesContext = [];

    // Add diet type
    if (preferences.diet_type) {
      preferencesContext.push(`Diet type: ${preferences.diet_type}`);
    }

    // Add calorie requirements
    if (preferences.daily_calorie_requirement) {
      preferencesContext.push(`Target daily calories: ${preferences.daily_calorie_requirement}`);
    }

    // Add allergies
    if (preferences.allergies) {
      preferencesContext.push(`Allergies: ${preferences.allergies}`);
    }

    // Add food intolerances
    if (preferences.food_intolerances) {
      preferencesContext.push(`Food intolerances: ${preferences.food_intolerances}`);
    }

    // Add preferred cuisines
    if (preferences.preferred_cuisines) {
      preferencesContext.push(`Preferred cuisines: ${preferences.preferred_cuisines}`);
    }

    // Add excluded ingredients
    if (preferences.excluded_ingredients) {
      preferencesContext.push(`Ingredients to avoid: ${preferences.excluded_ingredients}`);
    }

    // Add macro distribution
    const macros = [];
    if (preferences.macro_distribution_protein) {
      macros.push(`Protein: ${preferences.macro_distribution_protein}%`);
    }
    if (preferences.macro_distribution_fats) {
      macros.push(`Fats: ${preferences.macro_distribution_fats}%`);
    }
    if (preferences.macro_distribution_carbohydrates) {
      macros.push(`Carbohydrates: ${preferences.macro_distribution_carbohydrates}%`);
    }
    if (macros.length > 0) {
      preferencesContext.push(`Macro distribution: ${macros.join(", ")}`);
    }

    const prompt = `Please modify the following recipe according to these dietary preferences and restrictions:

DIETARY PREFERENCES:
${preferencesContext.join("\n")}

ORIGINAL RECIPE:
${recipeText}

INSTRUCTIONS:
1. Modify the recipe to accommodate all dietary restrictions and preferences
2. Suggest ingredient substitutions where necessary
3. Adjust portions if needed to meet calorie requirements
4. Ensure the recipe remains practical and delicious
5. Provide the complete modified recipe with ingredients list and cooking instructions
6. If any modification is not possible, explain why and suggest alternatives

Please provide the modified recipe in a clear, structured format.`;

    return prompt;
  }

  /**
   * Determines appropriate error code based on error type
   */
  private _getErrorCode(error: unknown): number {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("not found") || message.includes("preferences")) {
        return 422; // Unprocessable Entity
      }
      if (message.includes("empty") || message.includes("too long")) {
        return 400; // Bad Request
      }
      if (message.includes("authentication") || message.includes("api key")) {
        return 401; // Unauthorized
      }
      if (message.includes("rate limit")) {
        return 429; // Too Many Requests
      }
    }

    return 500; // Internal Server Error
  }

  /**
   * Logs recipe modification errors to the database
   */
  private async logModificationError(errorData: RecipeModificationErrorCommand): Promise<void> {
    try {
      const { error } = await this.supabase.from("recipe_modification_errors").insert({
        ...errorData,
        ai_model: this.openRouterService.config.defaultModel,
        timestamp: new Date().toISOString(),
      });

      if (error) {
        console.error("Failed to log modification error:", error);
      }
    } catch (error) {
      console.error("Error while logging modification error:", error);
    }
  }
}
