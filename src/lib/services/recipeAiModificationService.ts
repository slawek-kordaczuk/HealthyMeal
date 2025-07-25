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
      `Jesteś profesjonalnym dietetykiem i asystentem kucharskim specjalizującym się w modyfikacji przepisów. 
      Twoim zadaniem jest modyfikowanie przepisów zgodnie z określonymi preferencjami dietetycznymi i ograniczeniami.
      
      Wytyczne:
      - Zachowaj esencję i profil smakowy oryginalnego przepisu
      - Zaproponuj odpowiednie substytucje składników na podstawie ograniczeń dietetycznych
      - Dostosuj wielkości porcji i zawartość odżywczą zgodnie z potrzebami
      - Zapewnij jasne, praktyczne instrukcje gotowania
      - Upewnij się, że zmodyfikowany przepis jest bezpieczny i zbilansowany pod względem odżywczym
      - Jeśli modyfikacja nie jest możliwa lub bezpieczna, wyjaśnij dlaczego i zaproponuj alternatywy
      
      Zawsze odpowiadaj kompletnym, zmodyfikowanym przepisem w jasnym, uporządkowanym formacie w języku polskim.`
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
      preferencesContext.push(`Typ diety: ${preferences.diet_type}`);
    }

    // Add calorie requirements
    if (preferences.daily_calorie_requirement) {
      preferencesContext.push(`Docelowe dzienne kalorie: ${preferences.daily_calorie_requirement}`);
    }

    // Add allergies
    if (preferences.allergies) {
      preferencesContext.push(`Alergie: ${preferences.allergies}`);
    }

    // Add food intolerances
    if (preferences.food_intolerances) {
      preferencesContext.push(`Nietolerancje pokarmowe: ${preferences.food_intolerances}`);
    }

    // Add preferred cuisines
    if (preferences.preferred_cuisines) {
      preferencesContext.push(`Preferowane kuchnie: ${preferences.preferred_cuisines}`);
    }

    // Add excluded ingredients
    if (preferences.excluded_ingredients) {
      preferencesContext.push(`Składniki do unikania: ${preferences.excluded_ingredients}`);
    }

    // Add macro distribution
    const macros = [];
    if (preferences.macro_distribution_protein) {
      macros.push(`Białko: ${preferences.macro_distribution_protein}%`);
    }
    if (preferences.macro_distribution_fats) {
      macros.push(`Tłuszcze: ${preferences.macro_distribution_fats}%`);
    }
    if (preferences.macro_distribution_carbohydrates) {
      macros.push(`Węglowodany: ${preferences.macro_distribution_carbohydrates}%`);
    }
    if (macros.length > 0) {
      preferencesContext.push(`Rozkład makroskładników: ${macros.join(", ")}`);
    }

    const prompt = `Proszę zmodyfikuj poniższy przepis zgodnie z tymi preferencjami i ograniczeniami dietetycznymi:

PREFERENCJE DIETETYCZNE:
${preferencesContext.join("\n")}

ORYGINALNY PRZEPIS:
${recipeText}

INSTRUKCJE:
1. Zmodyfikuj przepis, aby uwzględnić wszystkie ograniczenia i preferencje dietetyczne
2. Zaproponuj substytucje składników tam, gdzie to konieczne
3. Dostosuj porcje w razie potrzeby, aby spełnić wymagania kaloryczne
4. Upewnij się, że przepis pozostaje praktyczny i smakowity
5. Podaj kompletny zmodyfikowany przepis z listą składników i instrukcjami gotowania
6. Jeśli jakakolwiek modyfikacja nie jest możliwa, wyjaśnij dlaczego i zaproponuj alternatywy

Proszę podaj zmodyfikowany przepis w jasnym, uporządkowanym formacie w języku polskim.`;

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
