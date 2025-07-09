import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "../useAuth";
import { authService } from "@/lib/services/authService";

// Mock the authService
vi.mock("@/lib/services/authService", () => ({
  authService: {
    checkAuthStatus: vi.fn(),
    logout: vi.fn(),
    notifyAuthChange: vi.fn(),
    redirectToHome: vi.fn(),
  },
}));

// Mock window event listeners
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, "addEventListener", {
  value: mockAddEventListener,
  writable: true,
});
Object.defineProperty(window, "removeEventListener", {
  value: mockRemoveEventListener,
  writable: true,
});

describe("useAuth (Enhanced)", () => {
  const mockAuthService = vi.mocked(authService);

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.checkAuthStatus.mockClear();
    mockAuthService.logout.mockClear();
    mockAuthService.notifyAuthChange.mockClear();
    mockAuthService.redirectToHome.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Authentication Check", () => {
    it("should start with loading state and then update auth status", async () => {
      mockAuthService.checkAuthStatus.mockResolvedValueOnce({
        isAuthenticated: true,
        userEmail: "test@example.com",
        userId: "test-user-123",
      });

      const { result } = renderHook(() => useAuth());

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userEmail).toBe(null);

      // Wait for auth check to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userEmail).toBe("test@example.com");
      expect(result.current.error).toBe(null);
      expect(mockAuthService.checkAuthStatus).toHaveBeenCalledTimes(1);
    });

    it("should handle unauthenticated user", async () => {
      mockAuthService.checkAuthStatus.mockResolvedValueOnce({
        isAuthenticated: false,
        userEmail: null,
        userId: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userEmail).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it("should handle auth check errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockAuthService.checkAuthStatus.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userEmail).toBe(null);
      expect(result.current.error).toBe("Wystąpił błąd podczas pobierania sesji użytkownika.");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error refreshing auth:", expect.any(Error));
    });
  });

  describe("Event Listeners", () => {
    it("should register window focus and authChange event listeners by default", async () => {
      mockAuthService.checkAuthStatus.mockResolvedValue({
        isAuthenticated: false,
        userEmail: null,
        userId: null,
      });

      const { unmount } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockAddEventListener).toHaveBeenCalledWith("focus", expect.any(Function));
        expect(mockAddEventListener).toHaveBeenCalledWith("authChange", expect.any(Function));
      });

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith("focus", expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith("authChange", expect.any(Function));
    });

    it("should not register event listeners when disabled", async () => {
      mockAuthService.checkAuthStatus.mockResolvedValue({
        isAuthenticated: false,
        userEmail: null,
        userId: null,
      });

      renderHook(() =>
        useAuth({
          refreshOnFocus: false,
          listenToAuthEvents: false,
        })
      );

      await waitFor(() => {
        expect(mockAuthService.checkAuthStatus).toHaveBeenCalled();
      });

      expect(mockAddEventListener).not.toHaveBeenCalledWith("focus", expect.any(Function));
      expect(mockAddEventListener).not.toHaveBeenCalledWith("authChange", expect.any(Function));
    });
  });

  describe("Manual Refresh", () => {
    it("should allow manual auth refresh", async () => {
      mockAuthService.checkAuthStatus
        .mockResolvedValueOnce({
          isAuthenticated: false,
          userEmail: null,
          userId: null,
        })
        .mockResolvedValueOnce({
          isAuthenticated: true,
          userEmail: "test@example.com",
          userId: "test-user-123",
        });

      const { result } = renderHook(() => useAuth());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);

      // Manual refresh
      await act(async () => {
        await result.current.refreshAuth();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userEmail).toBe("test@example.com");
      expect(mockAuthService.checkAuthStatus).toHaveBeenCalledTimes(2);
    });
  });

  describe("Logout", () => {
    it("should handle successful logout", async () => {
      mockAuthService.checkAuthStatus.mockResolvedValue({
        isAuthenticated: true,
        userEmail: "test@example.com",
        userId: "test-user-123",
      });
      mockAuthService.logout.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
      expect(mockAuthService.notifyAuthChange).toHaveBeenCalledTimes(1);
      expect(mockAuthService.redirectToHome).toHaveBeenCalledTimes(1);
      expect(result.current.error).toBe(null);
    });

    it("should handle logout errors", async () => {
      mockAuthService.checkAuthStatus.mockResolvedValue({
        isAuthenticated: true,
        userEmail: "test@example.com",
        userId: "test-user-123",
      });
      mockAuthService.logout.mockResolvedValueOnce({
        success: false,
        error: "Server error",
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.error).toBe("Server error");
      expect(mockAuthService.notifyAuthChange).toHaveBeenCalledTimes(1);
      expect(mockAuthService.redirectToHome).toHaveBeenCalledTimes(1);
    });

    it("should handle logout network errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockAuthService.checkAuthStatus.mockResolvedValue({
        isAuthenticated: true,
        userEmail: "test@example.com",
        userId: "test-user-123",
      });
      mockAuthService.logout.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.error).toBe("Wystąpił błąd podczas wylogowywania.");
      expect(mockAuthService.redirectToHome).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Logout error:", expect.any(Error));
    });
  });
});
