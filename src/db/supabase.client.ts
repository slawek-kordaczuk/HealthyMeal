import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types";

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

  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
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

export type Session = Awaited<ReturnType<SupabaseClient["auth"]["getSession"]>>["data"]["session"];

export async function getSession(context: { headers: Headers; cookies: AstroCookies }) {
  const supabase = createSupabaseServerInstance(context);
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("Error fetching session:", error);
    return null;
  }
  return session;
}
