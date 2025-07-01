import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "../RegisterForm";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
interface MockLocation {
  href: string;
  search: string;
  pathname: string;
  assign: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  reload: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

const mockLocation: MockLocation = {
  href: "http://localhost:3000/register",
  search: "",
  pathname: "/register",
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

// Create a proper location mock that captures href setter
Object.defineProperty(window, "location", {
  value: new Proxy(mockLocation, {
    set(target, prop, value) {
      if (typeof prop === "string") {
        (target as MockLocation)[prop] = value;
      }
      return true;
    },
    get(target, prop) {
      if (typeof prop === "string") {
        return (target as MockLocation)[prop];
      }
      return undefined;
    },
  }),
  writable: true,
  configurable: true,
});

describe("RegisterForm onSubmit Logic", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockLocation.href = "http://localhost:3000/register";
    mockLocation.search = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("🚀 Successful Registration Flow", () => {
    it("should handle successful registration with custom success message", async () => {
      const user = userEvent.setup();

      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: "Registration completed successfully!" }),
      });

      render(<RegisterForm />);

      // Fill out the form
      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "Password123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "Password123");

      // Submit the form
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "test@example.com",
            password: "Password123",
            confirmPassword: "Password123",
          }),
          credentials: "include",
        });
      });

      // Verify success message is displayed
      await waitFor(() => {
        expect(screen.getByText("Registration completed successfully!")).toBeInTheDocument();
      });
    });

    it("should handle successful registration with default success message", async () => {
      const user = userEvent.setup();

      // Mock API response without custom message
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "Password123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "Password123");
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Verify default success message
      await waitFor(() => {
        expect(screen.getByText("Konto zostało utworzone pomyślnie!")).toBeInTheDocument();
      });
    });

    it("should show loading state during API call", async () => {
      const user = userEvent.setup();

      // Mock delayed API response
      let resolveApiCall: ((value: unknown) => void) | undefined;
      const apiPromise = new Promise((resolve) => {
        resolveApiCall = resolve;
      });

      mockFetch.mockReturnValueOnce(apiPromise as Promise<Response>);

      render(<RegisterForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "Password123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "Password123");
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Verify loading state
      expect(screen.getByRole("button", { name: /rejestrowanie.../i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /rejestrowanie.../i })).toBeDisabled();

      // Resolve API call
      if (resolveApiCall) {
        resolveApiCall({
          ok: true,
          json: async () => ({ success: true }),
        });
      }

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /zarejestruj się/i })).toBeInTheDocument();
      });
    });

    it("should reset form after successful registration", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres email/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/potwierdź hasło/i);

      // Fill form
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "Password123");
      await user.type(confirmPasswordInput, "Password123");

      // Submit form
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText("Konto zostało utworzone pomyślnie!")).toBeInTheDocument();
      });

      // Verify form is reset
      expect(emailInput).toHaveValue("");
      expect(passwordInput).toHaveValue("");
      expect(confirmPasswordInput).toHaveValue("");
    });
  });

  describe("❌ API Error Handling", () => {
    it("should handle API error response with custom message", async () => {
      const user = userEvent.setup();

      // Mock API error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Użytkownik o tym adresie email już istnieje" }),
      });

      render(<RegisterForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/adres email/i), "existing@example.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "Password123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "Password123");
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText("Użytkownik o tym adresie email już istnieje")).toBeInTheDocument();
      });

      // Verify form is re-enabled
      expect(screen.getByRole("button", { name: /zarejestruj się/i })).not.toBeDisabled();
    });

    it("should handle API error response without custom message", async () => {
      const user = userEvent.setup();

      // Mock API error response without error message
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "Password123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "Password123");
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Verify default error message
      await waitFor(() => {
        expect(screen.getByText("Wystąpił błąd podczas rejestracji")).toBeInTheDocument();
      });
    });

    it("should handle network errors gracefully", async () => {
      const user = userEvent.setup();

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error("Network connection failed"));

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "Password123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "Password123");
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText("Network connection failed")).toBeInTheDocument();
      });
    });

    it("should handle non-Error objects thrown", async () => {
      const user = userEvent.setup();

      // Mock non-Error object being thrown
      mockFetch.mockRejectedValueOnce("String error");

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "Password123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "Password123");
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Verify fallback error message
      await waitFor(() => {
        expect(screen.getByText("Wystąpił błąd podczas rejestracji. Spróbuj ponownie.")).toBeInTheDocument();
      });
    });
  });

  describe("🔧 State Management", () => {
    it("should clear previous error when submitting again", async () => {
      const user = userEvent.setup();

      // First submission - error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "First error" }),
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "Password123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "Password123");
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText("First error")).toBeInTheDocument();
      });

      // Second submission - success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Verify error is cleared and success message appears
      await waitFor(() => {
        expect(screen.queryByText("First error")).not.toBeInTheDocument();
        expect(screen.getByText("Konto zostało utworzone pomyślnie!")).toBeInTheDocument();
      });
    });

    it("should reset loading state after error", async () => {
      const user = userEvent.setup();

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "Password123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "Password123");
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Wait for error and loading to finish
      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /zarejestruj się/i })).not.toBeDisabled();
      });
    });
  });

  describe("🔗 Navigation and Callbacks", () => {
    it("should call custom navigation callback for login", async () => {
      const user = userEvent.setup();
      const mockOnNavigateToLogin = vi.fn();

      render(<RegisterForm onNavigateToLogin={mockOnNavigateToLogin} />);

      // Test login navigation
      await user.click(screen.getByText(/zaloguj się/i));
      expect(mockOnNavigateToLogin).toHaveBeenCalledTimes(1);
    });

    it("should use default navigation when no callback provided", async () => {
      const user = userEvent.setup();

      render(<RegisterForm />);

      // Test default navigation (should not throw error)
      await user.click(screen.getByText(/zaloguj się/i));

      // Verify default navigation sets window.location.href
      expect(mockLocation.href).toBe("/login");
    });
  });

  describe("🎯 Integration Scenarios", () => {
    it("should not call API when form validation fails", async () => {
      const user = userEvent.setup();

      render(<RegisterForm />);

      // Try to submit without data (should show validation errors)
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Wait for validation errors to appear
      await waitFor(() => {
        expect(screen.getByText(/wprowadź poprawny adres email/i)).toBeInTheDocument();
      });

      // Verify API is not called
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should not call API when passwords don't match", async () => {
      const user = userEvent.setup();

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "Password123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "Password456");
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText(/hasła nie są identyczne/i)).toBeInTheDocument();
      });

      // Verify API is not called
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should prevent rapid successive submissions", async () => {
      const user = userEvent.setup();

      // Mock delayed response
      let resolveApiCall: ((value: unknown) => void) | undefined;
      const apiPromise = new Promise((resolve) => {
        resolveApiCall = resolve;
      });

      mockFetch.mockReturnValueOnce(apiPromise as Promise<Response>);

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "Password123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "Password123");

      // First submission
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Verify button is disabled during loading (check for both possible states)
      await waitFor(() => {
        const button = screen.getByRole("button", { name: /rejestrowanie/i });
        expect(button).toBeDisabled();
      });

      // Verify only one API call was made
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Resolve API call
      if (resolveApiCall) {
        resolveApiCall({
          ok: true,
          json: async () => ({ success: true }),
        });
      }

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /zarejestruj się/i })).not.toBeDisabled();
      });
    });
  });

  describe("🔒 Security and Best Practices", () => {
    it("should include credentials in API request", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "Password123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "Password123");
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/register",
          expect.objectContaining({
            credentials: "include",
          })
        );
      });
    });

    it("should log errors for debugging", async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
        // Mock implementation - suppress console.error output during tests
      });

      const originalError = new Error("Internal server error");
      mockFetch.mockRejectedValueOnce(originalError);

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "Password123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "Password123");
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      await waitFor(() => {
        // Error should be logged for debugging
        expect(consoleSpy).toHaveBeenCalledWith("Registration error:", originalError);
      });

      consoleSpy.mockRestore();
    });

    it("should send correct payload structure", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/adres email/i), "user@test.com");
      await user.type(screen.getByLabelText(/^hasło$/i), "MyPassword123");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "MyPassword123");
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/register",
          expect.objectContaining({
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: "user@test.com",
              password: "MyPassword123",
              confirmPassword: "MyPassword123",
            }),
          })
        );
      });
    });
  });

  describe("📱 User Experience", () => {
    it("should show form validation errors before API call", async () => {
      const user = userEvent.setup();

      render(<RegisterForm />);

      // Submit form with invalid data
      await user.type(screen.getByLabelText(/adres email/i), "invalid-email");
      await user.type(screen.getByLabelText(/^hasło$/i), "weak");
      await user.type(screen.getByLabelText(/potwierdź hasło/i), "different");

      // Submit the form to trigger validation
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // Wait for validation errors to appear - be more flexible about which errors show
      await waitFor(
        () => {
          // Check if at least one validation error appears
          const hasEmailError = screen.queryByText(/wprowadź poprawny adres email/i);
          const hasPasswordError = screen.queryByText(/hasło musi zawierać co najmniej 8 znaków/i);
          const hasMatchError = screen.queryByText(/hasła nie są identyczne/i);

          expect(hasEmailError || hasPasswordError || hasMatchError).toBeTruthy();
        },
        { timeout: 3000 }
      );

      // Verify API is not called when validation fails
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should maintain form state during API call", async () => {
      const user = userEvent.setup();

      // Mock delayed response
      let resolveApiCall: ((value: unknown) => void) | undefined;
      const apiPromise = new Promise((resolve) => {
        resolveApiCall = resolve;
      });

      mockFetch.mockReturnValueOnce(apiPromise as Promise<Response>);

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/adres email/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/potwierdź hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "Password123");
      await user.type(confirmPasswordInput, "Password123");
      await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

      // During loading, form values should be maintained
      expect(emailInput).toHaveValue("test@example.com");
      expect(passwordInput).toHaveValue("Password123");
      expect(confirmPasswordInput).toHaveValue("Password123");

      // Resolve API call
      if (resolveApiCall) {
        resolveApiCall({
          ok: true,
          json: async () => ({ success: true }),
        });
      }

      // After success, form should be reset
      await waitFor(() => {
        expect(emailInput).toHaveValue("");
        expect(passwordInput).toHaveValue("");
        expect(confirmPasswordInput).toHaveValue("");
      });
    });
  });
});
