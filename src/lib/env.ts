/* eslint-disable @typescript-eslint/no-explicit-any */

// Utility functions for accessing environment variables in Cloudflare Workers
// This is needed because Cloudflare Workers runtime might handle env variables differently

export function getEnvVar(key: string): string | undefined {
  // Try different ways to access environment variables

  // Method 1: Standard Astro/Vite import.meta.env
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }

  // Method 2: Global process.env (if available)
  if ((globalThis as any).process?.env?.[key]) {
    return (globalThis as any).process.env[key];
  }

  // Method 3: Direct global access
  if ((globalThis as any)[key]) {
    return (globalThis as any)[key];
  }

  return undefined;
}

export function getRequiredEnvVar(key: string): string {
  const value = getEnvVar(key);

  if (!value) {
    // Debug info for troubleshooting
    console.error("Environment variable debug:", {
      key,
      "import.meta.env[key]": !!import.meta.env[key],
      "globalThis.process?.env[key]": !!(globalThis as any).process?.env?.[key],
      "globalThis[key]": !!(globalThis as any)[key],
      "Available import.meta.env keys": Object.keys(import.meta.env),
    });

    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}
