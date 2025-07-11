import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getRequiredEnvVar } from "../lib/env";

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: false,
  httpOnly: false,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader || cookieHeader.trim() === "") {
    return [];
  }

  return cookieHeader
    .split(";")
    .map((cookie) => {
      const [name, ...rest] = cookie.trim().split("=");
      return { name: name || "", value: rest.join("=") || "" };
    })
    .filter((cookie) => cookie.name !== "");
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const cookieHeader = context.headers.get("Cookie") ?? "";

  const supabaseUrl = getRequiredEnvVar("SUPABASE_URL");
  const supabaseKey = getRequiredEnvVar("SUPABASE_KEY");

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        const cookies = parseCookieHeader(cookieHeader);
        return cookies;
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

export type SupabaseClient = ReturnType<typeof createSupabaseServerInstance>;

/**
 * Creates a simple Supabase client for teardown operations in test environment
 * This client doesn't use cookies and is suitable for Node.js environments like Playwright
 */
export const createSupabaseTeardownClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variables");
  }

  // Use service role key if available for teardown operations (bypasses RLS)
  const keyToUse = supabaseServiceKey || supabaseKey;

  return {
    client: createClient<Database>(supabaseUrl, keyToUse),
    isServiceRole: !!supabaseServiceKey,
    url: supabaseUrl,
    keyType: supabaseServiceKey ? "Service Role" : "Anon",
  };
};

export type SupabaseTeardownClient = ReturnType<typeof createSupabaseTeardownClient>;
