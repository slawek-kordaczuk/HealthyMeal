import { createSupabaseServerInstance } from "../db/supabase.client";
import { defineMiddleware } from "astro:middleware";

// Public paths - Auth pages and API endpoints
const PUBLIC_PATHS = [
  // Public pages
  "/",
  "/login",
  "/register",
  "/recover-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/recover",
];

// Protected paths that require authentication
const PROTECTED_PATHS = ["/recipes", "/add-recipe", "/preferences"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase client instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Store supabase instance in locals
  locals.supabase = supabase;

  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // User is authenticated, store user info in locals
    locals.user = {
      email: user.email,
      id: user.id,
    };
  } else if (PROTECTED_PATHS.includes(url.pathname)) {
    // User is not authenticated and trying to access protected route
    // Store the current URL to redirect back after login
    const returnUrl = url.pathname + url.search;
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("returnUrl", returnUrl);

    return redirect(loginUrl.toString());
  }

  return next();
});
