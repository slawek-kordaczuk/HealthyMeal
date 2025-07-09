import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NavigationMenuContainer } from "../NavigationMenuContainer";
import { useAuth } from "../hooks/useAuth";

// Mock the useAuth hook
vi.mock("../hooks/useAuth");
const mockUseAuth = vi.mocked(useAuth);

describe("NavigationMenuContainer (Refactored)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should display loading state correctly", () => {
      mockUseAuth.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        userEmail: null,
        userId: null,
        logout: vi.fn(),
        refreshAuth: vi.fn(),
        error: null,
      });

      render(<NavigationMenuContainer />);

      expect(screen.getByTestId("navigation-loading")).toBeInTheDocument();
      expect(screen.getByTestId("nav-logo-link-loading")).toBeInTheDocument();
      expect(screen.getByText("HealthyMeal")).toBeInTheDocument();
    });
  });

  describe("Non-Authenticated State", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        userEmail: null,
        userId: null,
        logout: vi.fn(),
        refreshAuth: vi.fn(),
        error: null,
      });
    });

    it("should display non-authenticated layout", () => {
      render(<NavigationMenuContainer />);

      expect(screen.getByTestId("navigation-container")).toBeInTheDocument();
      expect(screen.getByTestId("nav-logo-link")).toBeInTheDocument();
      expect(screen.getByTestId("nav-auth-buttons")).toBeInTheDocument();
      expect(screen.getByTestId("nav-login-button")).toBeInTheDocument();
      expect(screen.getByTestId("nav-register-button")).toBeInTheDocument();
    });

    it("should have correct links for non-authenticated users", () => {
      render(<NavigationMenuContainer />);

      const logoLink = screen.getByTestId("nav-logo-link");
      const loginButton = screen.getByTestId("nav-login-button");
      const registerButton = screen.getByTestId("nav-register-button");

      expect(logoLink).toHaveAttribute("href", "/");
      expect(loginButton).toHaveAttribute("href", "/login");
      expect(registerButton).toHaveAttribute("href", "/register");
    });

    it("should display mobile menu button", () => {
      render(<NavigationMenuContainer />);

      expect(screen.getByTestId("nav-mobile-menu-button")).toBeInTheDocument();
    });
  });

  describe("Authenticated State", () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        userEmail: "test@example.com",
        userId: "test-user-123",
        logout: mockLogout,
        refreshAuth: vi.fn(),
        error: null,
      });
    });

    it("should display authenticated layout", () => {
      render(<NavigationMenuContainer />);

      expect(screen.getByTestId("navigation-container")).toBeInTheDocument();
      expect(screen.getByTestId("nav-authenticated-links")).toBeInTheDocument();
      expect(screen.getByTestId("nav-user-actions")).toBeInTheDocument();
      expect(screen.getByTestId("nav-user-email")).toBeInTheDocument();
      expect(screen.getByTestId("nav-logout-button")).toBeInTheDocument();
    });

    it("should display all authenticated navigation links", () => {
      render(<NavigationMenuContainer />);

      expect(screen.getByTestId("nav-link-healthymeal")).toBeInTheDocument();
      expect(screen.getByTestId("nav-link-moje-przepisy")).toBeInTheDocument();
      expect(screen.getByTestId("nav-link-dodaj-przepis")).toBeInTheDocument();
      expect(screen.getByTestId("nav-link-preferencje")).toBeInTheDocument();
    });

    it("should display user email", () => {
      render(<NavigationMenuContainer />);

      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    it("should call logout function when logout button is clicked", async () => {
      render(<NavigationMenuContainer />);

      const logoutButton = screen.getByTestId("nav-logout-button");
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });

    it("should have correct href attributes for authenticated links", () => {
      render(<NavigationMenuContainer />);

      expect(screen.getByTestId("nav-link-healthymeal")).toHaveAttribute("href", "/");
      expect(screen.getByTestId("nav-link-moje-przepisy")).toHaveAttribute("href", "/recipes");
      expect(screen.getByTestId("nav-link-dodaj-przepis")).toHaveAttribute("href", "/add-recipe");
      expect(screen.getByTestId("nav-link-preferencje")).toHaveAttribute("href", "/preferences");
    });

    it("should display mobile menu button for authenticated users", () => {
      render(<NavigationMenuContainer />);

      expect(screen.getByTestId("nav-mobile-menu-button-authenticated")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message when present", () => {
      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        userEmail: null,
        userId: null,
        logout: vi.fn(),
        refreshAuth: vi.fn(),
        error: "Authentication error occurred",
      });

      render(<NavigationMenuContainer />);

      expect(screen.getByText("Authentication error occurred")).toBeInTheDocument();
    });

    it("should not display error message when error is null", () => {
      mockUseAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        userEmail: null,
        userId: null,
        logout: vi.fn(),
        refreshAuth: vi.fn(),
        error: null,
      });

      render(<NavigationMenuContainer />);

      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe("Hook Integration", () => {
    it("should pass correct options to useAuth hook", () => {
      render(<NavigationMenuContainer />);

      expect(mockUseAuth).toHaveBeenCalledWith({
        refreshOnFocus: true,
        listenToAuthEvents: true,
      });
    });
  });
});
