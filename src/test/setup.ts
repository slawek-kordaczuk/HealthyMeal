import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock Next Themes to avoid SSR issues in tests
beforeEach(() => {
  vi.mock("next-themes", () => ({
    useTheme: () => ({
      theme: "light",
      setTheme: vi.fn(),
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  }));
});

// Mock Supabase for unit tests
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  })),
}));

// Mock environment variables for tests
vi.stubGlobal("import.meta", {
  env: {
    PUBLIC_SUPABASE_URL: "http://localhost:54321",
    PUBLIC_SUPABASE_ANON_KEY: "test-key",
    PUBLIC_OPENROUTER_API_KEY: "test-openrouter-key",
  },
});

// Global test configuration
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
