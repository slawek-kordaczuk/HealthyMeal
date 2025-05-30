import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { z } from "zod";

export const prerender = false;

const registerSchema = z
  .object({
    email: z.string().email("Nieprawidłowy format adresu email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    console.log("[Register API] Request body:", body);

    // Validate input data
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("[Register API] Validation failed:", validationResult.error.issues);
      return new Response(
        JSON.stringify({
          error: "Błędne dane wejściowe",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validationResult.data;
    console.log("[Register API] Attempting registration for:", email);

    // Create Supabase client instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Registration error:", error);
      let errorMessage = "Wystąpił błąd podczas rejestracji";

      if (error.message.includes("User already registered")) {
        errorMessage = "Użytkownik z tym adresem email już istnieje";
      } else if (error.message.includes("Password")) {
        errorMessage = "Hasło nie spełnia wymagań bezpieczeństwa";
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If signup was successful, automatically sign in the user
    if (data.user) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Auto sign-in after registration failed:", signInError);
        // Still return success for registration, but without session
        return new Response(
          JSON.stringify({
            user: {
              id: data.user.id,
              email: data.user.email,
            },
            message: "Konto zostało utworzone pomyślnie. Proszę się zalogować.",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Both registration and auto sign-in successful
      return new Response(
        JSON.stringify({
          user: {
            id: signInData.user.id,
            email: signInData.user.email,
          },
          message: "Konto zostało utworzone pomyślnie i zostałeś automatycznie zalogowany",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fallback if data.user is null (should not happen)
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd podczas rejestracji" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Register API error:", error);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
