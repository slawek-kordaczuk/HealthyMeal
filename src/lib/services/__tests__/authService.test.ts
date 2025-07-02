import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authService } from "../authService";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window methods
const mockDispatchEvent = vi.fn();
Object.defineProperty(window, "dispatchEvent", {
  value: mockDispatchEvent,
  writable: true,
});

Object.defineProperty(window, "location", {
  value: { href: "" },
  writable: true,
});

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkAuthStatus", () => {
    it("should return authenticated status when API returns 200", async () => {
      const mockProfile = { email: "test@example.com", id: "123" };
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockProfile),
      });

      const result = await authService.checkAuthStatus();

      expect(result).toEqual({
        isAuthenticated: true,
        userEmail: "test@example.com",
        userId: "123",
      });
      expect(mockFetch).toHaveBeenCalledWith("/api/user/profile", {
        method: "GET",
        credentials: "include",
      });
    });

    it("should return unauthenticated status when API returns non-200", async () => {
      mockFetch.mockResolvedValueOnce({
        status: 401,
      });

      const result = await authService.checkAuthStatus();

      expect(result).toEqual({
        isAuthenticated: false,
        userEmail: null,
        userId: null,
      });
    });

    it("should handle network errors gracefully", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await authService.checkAuthStatus();

      expect(result).toEqual({
        isAuthenticated: false,
        userEmail: null,
        userId: null,
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith("Auth check failed:", expect.any(Error));
    });
  });

  describe("logout", () => {
    it("should return success when logout API succeeds", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await authService.logout();

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    });

    it("should return error when logout API fails", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server error"),
      });

      const result = await authService.logout();

      expect(result).toEqual({
        success: false,
        error: "Server error",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith("Logout failed:", "Server error");
    });

    it("should handle network errors during logout", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await authService.logout();

      expect(result).toEqual({
        success: false,
        error: "Network error",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith("Logout error:", expect.any(Error));
    });
  });

  describe("notifyAuthChange", () => {
    it("should dispatch authChange event", () => {
      authService.notifyAuthChange();

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "authChange",
        })
      );
    });
  });

  describe("redirectToHome", () => {
    it("should set window.location.href to home page", () => {
      authService.redirectToHome();

      expect(window.location.href).toBe("/");
    });
  });
});
