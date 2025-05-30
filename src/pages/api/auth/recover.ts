import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { z } from "zod";

export const prerender = false;

const recoverSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Validate input data
    const validationResult = recoverSchema.safeParse(body);
    if (!validationResult.success) {
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

    const { email } = validationResult.data;

    // Create Supabase client instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error);
      return new Response(JSON.stringify({ error: "Wystąpił błąd podczas wysyłania emaila resetującego" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Always return success message for security reasons
    // (don't reveal if email exists in system)
    return new Response(
      JSON.stringify({
        message: "Jeśli podany adres email istnieje w naszym systemie, wysłaliśmy link do resetowania hasła",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Recover API error:", error);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
