import React from "react";
import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "next-themes";

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };

// Common test utilities
export const createMockUser = () => ({
  id: "test-user-id",
  email: "test@example.com",
  user_metadata: {
    name: "Test User",
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const createMockRecipe = () => ({
  id: "test-recipe-id",
  title: "Test Recipe",
  description: "A test recipe description",
  ingredients: ["ingredient 1", "ingredient 2"],
  instructions: ["step 1", "step 2"],
  prep_time: 30,
  cook_time: 45,
  servings: 4,
  user_id: "test-user-id",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});
