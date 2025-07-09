import { createSupabaseTeardownClient } from "../src/db/supabase.client";

async function globalTeardown() {
  console.log("🧹 Czyszczenie danych testowego użytkownika po testach e2e...");

  // Get test user ID from environment
  const testUserId = process.env.E2E_USERNAME_ID;
  if (!testUserId) {
    console.error("❌ Brak zmiennej środowiskowej E2E_USERNAME_ID");
    throw new Error("Missing test user ID environment variable");
  }

  // Create Supabase client for teardown using the shared client configuration
  const { client: supabase, isServiceRole } = createSupabaseTeardownClient();

  // If using anon key, try to authenticate as the test user
  if (!isServiceRole) {
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (testEmail && testPassword) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (authError) {
        console.error("❌ Błąd logowania w teardown:", authError);
        throw authError;
      }
    }
  }

  try {
    // 1. Delete recipe modifications for test user (has FK to recipes and user_id)
    const { error: modificationsError } = await supabase
      .from("recipe_modifications")
      .delete()
      .eq("user_id", testUserId);

    if (modificationsError) {
      console.error("❌ Błąd podczas usuwania modyfikacji przepisów:", modificationsError);
      throw modificationsError;
    }

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
      const recipeIds = userRecipes.map((recipe: { id: number }) => recipe.id);
      const { error: statisticsError } = await supabase.from("recipe_statistics").delete().in("recipe_id", recipeIds);

      if (statisticsError) {
        console.error("❌ Błąd podczas usuwania statystyk przepisów:", statisticsError);
        throw statisticsError;
      }
    }

    // 4. Delete recipes of test user
    const { data: deletedRecipes, error: recipesError } = await supabase
      .from("recipes")
      .delete()
      .eq("user_id", testUserId)
      .select();

    if (recipesError) {
      console.error("❌ Błąd podczas usuwania przepisów:", recipesError);
      throw recipesError;
    }

    // 5. Delete preferences of test user
    const { data: deletedPreferences, error: preferencesError } = await supabase
      .from("preferences")
      .delete()
      .eq("user_id", testUserId)
      .select();

    if (preferencesError) {
      console.error("❌ Błąd podczas usuwania preferencji:", preferencesError);
      throw preferencesError;
    }

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
    }

    // Show summary of what was cleaned up
    const recipesCount = deletedRecipes?.length || 0;
    const preferencesCount = deletedPreferences?.length || 0;

    if (recipesCount > 0 || preferencesCount > 0) {
      console.log(`✅ Usunięto ${recipesCount} przepisów i ${preferencesCount} preferencji testowego użytkownika`);
    }

    console.log("🎉 Dane testowego użytkownika zostały pomyślnie wyczyszczone po testach e2e");
  } catch (error) {
    console.error("❌ Błąd krytyczny podczas czyszczenia danych testowego użytkownika:", error);
    throw error;
  }
}

export default globalTeardown;
