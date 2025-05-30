import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { z } from "zod";

export const prerender = false;

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    console.log("[Login API] Request body:", body);

    // Validate input data
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("[Login API] Validation failed:", validationResult.error.issues);
      return new Response(
        JSON.stringify({
          error: "Błędne dane wejściowe",
          details: validationResult.error.issues.map((issue) => issue.message),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validationResult.data;
    console.log("[Login API] Attempting login for:", email);

    // Create Supabase client instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("[Login API] Supabase error:", error);
      return new Response(
        JSON.stringify({
          error:
            error.message === "Invalid login credentials"
              ? "Nieprawidłowy email lub hasło"
              : "Wystąpił błąd podczas logowania",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[Login API] Login successful for user:", data.user.email);
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Login API error:", error);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
