import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";

async function globalTeardown() {
  console.log("🧹 Czyszczenie danych testowego użytkownika po testach e2e...");

  // Create Supabase client for teardown
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testUserId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Brak zmiennych środowiskowych SUPABASE_URL lub SUPABASE_KEY");
    throw new Error("Missing Supabase environment variables");
  }

  if (!testUserId) {
    console.error("❌ Brak zmiennej środowiskowej E2E_USERNAME_ID");
    throw new Error("Missing test user ID environment variable");
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  try {
    console.log(`🎯 Usuwanie danych dla testowego użytkownika: ${testUserId}`);

    // 1. Delete recipe modifications for test user (has FK to recipes and user_id)
    const { error: modificationsError } = await supabase
      .from("recipe_modifications")
      .delete()
      .eq("user_id", testUserId);

    if (modificationsError) {
      console.error("❌ Błąd podczas usuwania modyfikacji przepisów:", modificationsError);
      throw modificationsError;
    }

    console.log("✅ Usunięto modyfikacje przepisów testowego użytkownika");

    // 2. Get recipes of test user to delete related statistics
    const { data: userRecipes, error: recipesListError } = await supabase
      .from("recipes")
      .select("id")
      .eq("user_id", testUserId);

    if (recipesListError) {
      console.error("❌ Błąd podczas pobierania przepisów użytkownika:", recipesListError);
      throw recipesListError;
    }

    // 3. Delete recipe statistics for user's recipes
    if (userRecipes && userRecipes.length > 0) {
      const recipeIds = userRecipes.map((recipe) => recipe.id);
      const { error: statisticsError } = await supabase.from("recipe_statistics").delete().in("recipe_id", recipeIds);

      if (statisticsError) {
        console.error("❌ Błąd podczas usuwania statystyk przepisów:", statisticsError);
        throw statisticsError;
      }

      console.log("✅ Usunięto statystyki przepisów testowego użytkownika");
    }

    // 4. Delete recipes of test user
    const { error: recipesError } = await supabase.from("recipes").delete().eq("user_id", testUserId);

    if (recipesError) {
      console.error("❌ Błąd podczas usuwania przepisów:", recipesError);
      throw recipesError;
    }

    console.log("✅ Usunięto przepisy testowego użytkownika");

    // 5. Delete preferences of test user
    const { error: preferencesError } = await supabase.from("preferences").delete().eq("user_id", testUserId);

    if (preferencesError) {
      console.error("❌ Błąd podczas usuwania preferencji:", preferencesError);
      throw preferencesError;
    }

    console.log("✅ Usunięto preferencje testowego użytkownika");

    // 6. Clean up all recipe modification errors (these don't have user_id)
    // Only delete recent ones to avoid affecting other tests
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { error: errorsError } = await supabase
      .from("recipe_modification_errors")
      .delete()
      .gte("timestamp", oneHourAgo);

    if (errorsError) {
      console.error("❌ Błąd podczas usuwania błędów modyfikacji:", errorsError);
      // Don't throw - this is non-critical
      console.warn("⚠️ Kontynuacja mimo błędu w czyszczeniu błędów modyfikacji");
    } else {
      console.log("✅ Usunięto niedawne błędy modyfikacji przepisów");
    }

    console.log("🎉 Dane testowego użytkownika zostały pomyślnie wyczyszczone po testach e2e");
  } catch (error) {
    console.error("❌ Błąd krytyczny podczas czyszczenia danych testowego użytkownika:", error);
    throw error;
  }
}

export default globalTeardown;
