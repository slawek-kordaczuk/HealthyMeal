import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "../components/LoginForm";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const mockLocation = {
  href: "http://localhost:3000/login",
  search: "",
  pathname: "/login",
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Mock URLSearchParams
global.URLSearchParams = class MockURLSearchParams {
  private params = new Map<string, string>();

  constructor(search?: string) {
    if (search) {
      const cleanSearch = search.startsWith("?") ? search.slice(1) : search;
      cleanSearch.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        if (key) {
          this.params.set(decodeURIComponent(key), decodeURIComponent(value || ""));
        }
      });
    }
  }

  get(key: string): string | null {
    return this.params.get(key) || null;
  }

  set(key: string, value: string): void {
    this.params.set(key, value);
  }
} as unknown as typeof URLSearchParams;

describe("LoginForm onSubmit Logic", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockLocation.href = "http://localhost:3000/login";
    mockLocation.search = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("🚀 Successful Login Flow", () => {
    it("should handle successful login with custom callback", async () => {
      const user = userEvent.setup();

      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: "Login successful" }),
      });

      const mockOnSuccess = vi.fn();
      render(<LoginForm onSuccess={mockOnSuccess} />);

      // Fill out the form
      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło/i), "password123");

      // Submit the form
      await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
          credentials: "include",
        });
      });

      // Verify success callback is called
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
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

      render(<LoginForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło/i), "password123");
      await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

      // Verify loading state
      expect(screen.getByRole("button", { name: /logowanie.../i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /logowanie.../i })).toBeDisabled();

      // Resolve API call
      if (resolveApiCall) {
        resolveApiCall({
          ok: true,
          json: async () => ({ success: true }),
        });
      }

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /zaloguj się/i })).toBeInTheDocument();
      });
    });

    it("should disable form inputs during loading", async () => {
      const user = userEvent.setup();

      // Mock delayed response
      let resolveApiCall: ((value: unknown) => void) | undefined;
      const apiPromise = new Promise((resolve) => {
        resolveApiCall = resolve;
      });

      mockFetch.mockReturnValueOnce(apiPromise as Promise<Response>);

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło/i), "password");
      await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

      // Verify inputs are disabled during loading
      expect(screen.getByLabelText(/adres email/i)).toBeDisabled();
      expect(screen.getByLabelText(/hasło/i)).toBeDisabled();

      // Resolve API call
      if (resolveApiCall) {
        resolveApiCall({
          ok: true,
          json: async () => ({ success: true }),
        });
      }

      // Wait for form to be re-enabled
      await waitFor(() => {
        expect(screen.getByLabelText(/adres email/i)).not.toBeDisabled();
        expect(screen.getByLabelText(/hasło/i)).not.toBeDisabled();
      });
    });
  });

  describe("❌ API Error Handling", () => {
    it("should handle API error response with custom message", async () => {
      const user = userEvent.setup();

      // Mock API error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Nieprawidłowe dane logowania" }),
      });

      render(<LoginForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText("Nieprawidłowe dane logowania")).toBeInTheDocument();
      });

      // Verify form is re-enabled
      expect(screen.getByRole("button", { name: /zaloguj się/i })).not.toBeDisabled();
    });

    it("should handle API error response without custom message", async () => {
      const user = userEvent.setup();

      // Mock API error response without error message
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło/i), "password");
      await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

      // Verify default error message
      await waitFor(() => {
        expect(screen.getByText("Wystąpił błąd podczas logowania")).toBeInTheDocument();
      });
    });

    it("should handle network errors gracefully", async () => {
      const user = userEvent.setup();

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło/i), "password");
      await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

      // Verify error handling - LoginForm shows the actual error message
      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
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

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło/i), "wrong");
      await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText("First error")).toBeInTheDocument();
      });

      // Second submission - success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await user.clear(screen.getByLabelText(/hasło/i));
      await user.type(screen.getByLabelText(/hasło/i), "correct");
      await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

      // Verify error is cleared
      await waitFor(() => {
        expect(screen.queryByText("First error")).not.toBeInTheDocument();
      });
    });
  });

  describe("🔗 Navigation and Callbacks", () => {
    it("should call custom navigation callbacks", async () => {
      const user = userEvent.setup();
      const mockOnNavigateToRegister = vi.fn();
      const mockOnNavigateToRecover = vi.fn();

      render(
        <LoginForm onNavigateToRegister={mockOnNavigateToRegister} onNavigateToRecover={mockOnNavigateToRecover} />
      );

      // Test register navigation
      await user.click(screen.getByText(/zarejestruj się/i));
      expect(mockOnNavigateToRegister).toHaveBeenCalledTimes(1);

      // Test recover navigation
      await user.click(screen.getByText(/zapomniałeś hasła/i));
      expect(mockOnNavigateToRecover).toHaveBeenCalledTimes(1);
    });
  });

  describe("🎯 Integration Scenarios", () => {
    it("should not call API when form validation fails", async () => {
      const user = userEvent.setup();

      render(<LoginForm />);

      // Try to submit without data (should show validation errors)
      await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

      // Verify validation errors appear
      await waitFor(() => {
        expect(screen.getByText(/wprowadź poprawny adres email/i)).toBeInTheDocument();
        expect(screen.getByText(/hasło jest wymagane/i)).toBeInTheDocument();
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

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło/i), "password");

      // First submission
      await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

      // Verify button is disabled during loading
      const submitButton = screen.getByRole("button", { name: /logowanie.../i });
      expect(submitButton).toBeDisabled();

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
        expect(screen.getByRole("button", { name: /zaloguj się/i })).not.toBeDisabled();
      });
    });
  });

  describe("🔒 Security", () => {
    it("should include credentials in API request", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło/i), "password");
      await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/login",
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

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/adres email/i), "test@example.com");
      await user.type(screen.getByLabelText(/hasło/i), "password");
      await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

      await waitFor(() => {
        // Error should be logged for debugging
        expect(consoleSpy).toHaveBeenCalledWith("Login error:", originalError);
      });

      consoleSpy.mockRestore();
    });
  });
});
