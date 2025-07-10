// Polyfill MessageChannel for Cloudflare Workers

if (typeof MessageChannel === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).MessageChannel = class MessageChannel {
    port1: { postMessage: (message: unknown) => void; onmessage: ((event: { data: unknown }) => void) | null };
    port2: { postMessage: (message: unknown) => void; onmessage: ((event: { data: unknown }) => void) | null };

    constructor() {
      this.port1 = {
        postMessage: (message: unknown) => {
          setTimeout(() => {
            if (this.port2.onmessage) {
              this.port2.onmessage({ data: message });
            }
          }, 0);
        },
        onmessage: null,
      };
      this.port2 = {
        postMessage: (message: unknown) => {
          setTimeout(() => {
            if (this.port1.onmessage) {
              this.port1.onmessage({ data: message });
            }
          }, 0);
        },
        onmessage: null,
      };
    }
  };
}

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
