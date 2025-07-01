import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "../useAuth";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useAuth", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("should initialize with loading state", () => {
    mockFetch.mockImplementation(
      () =>
        new Promise(() => {
          /* Never resolves */
        })
    ); // Never resolves

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it("should set authenticated state on successful auth (200 response)", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe("authenticated");
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledWith("/api/preferences", {
      method: "GET",
      credentials: "include",
    });
  });

  it("should set authenticated state on 404 response (no preferences but authenticated)", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 404,
      ok: false,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe("authenticated");
    expect(result.current.error).toBe(null);
  });

  it("should set unauthenticated state on 401 response", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 401,
      ok: false,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network error");
    mockFetch.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBe(null);
    expect(result.current.error).toBe("Wystąpił błąd podczas pobierania sesji użytkownika.");
  });

  it("should call API only once on mount", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
    });

    const { result, rerender } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Rerender should not trigger another API call
    rerender();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
