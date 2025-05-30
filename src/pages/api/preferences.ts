import type { APIRoute } from "astro";
import { PreferencesService } from "../../lib/services/preferencesService";

// Disable prerendering for dynamic API route
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log("[Preferences API POST] Starting request processing");

    // Get authenticated user from middleware
    if (!locals.user) {
      console.log("[Preferences API POST] No user in locals, returning 401");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[Preferences API POST] User:", { id: locals.user.id, email: locals.user.email });

    // Parse request body
    const data = await request.json();
    console.log("[Preferences API POST] Request data:", data);

    // Set userId from authenticated session (override any provided userId)
    const preferencesData = {
      ...data,
      userId: locals.user.id,
    };

    console.log("[Preferences API POST] Final preferences data:", preferencesData);

    // Create or update preferences
    const preferencesService = new PreferencesService(locals.supabase);
    const result = await preferencesService.createOrUpdatePreferences(preferencesData);

    console.log("[Preferences API POST] Service result:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Preferences API POST] Error processing preferences:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get authenticated user from middleware
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const preferencesService = new PreferencesService(locals.supabase);
    const preferences = await preferencesService.getUserPreferences(locals.user.id);

    return new Response(JSON.stringify(preferences), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
