import { useState, useEffect, useCallback } from "react";
import { authService, type AuthState } from "@/lib/services/authService";

interface UseAuthOptions {
  /**
   * Whether to listen for window focus events to refresh auth status
   * @default true
   */
  refreshOnFocus?: boolean;
  /**
   * Whether to listen for custom auth change events
   * @default true
   */
  listenToAuthEvents?: boolean;
}

interface UseAuthReturn extends AuthState {
  /**
   * Manually refresh the authentication status
   */
  refreshAuth: () => Promise<void>;
  /**
   * Log out the current user
   */
  logout: () => Promise<void>;
  /**
   * Error message if auth operations fail
   */
  error: string | null;
}

export const useAuth = (options: UseAuthOptions = {}): UseAuthReturn => {
  const { refreshOnFocus = true, listenToAuthEvents = true } = options;

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userEmail: null,
    userId: null,
  });

  const [error, setError] = useState<string | null>(null);

  const refreshAuth = useCallback(async () => {
    try {
      setError(null);
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      const { isAuthenticated, userEmail, userId } = await authService.checkAuthStatus();

      setAuthState({
        isAuthenticated,
        userEmail,
        userId,
        isLoading: false,
      });
    } catch (err) {
      console.error("Error refreshing auth:", err);
      setError("Wystąpił błąd podczas pobierania sesji użytkownika.");
      setAuthState({
        isAuthenticated: false,
        userEmail: null,
        userId: null,
        isLoading: false,
      });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setError(null);
      const result = await authService.logout();

      if (!result.success) {
        setError(result.error || "Wystąpił błąd podczas wylogowywania.");
      }

      // Notify about auth change and redirect regardless of API success
      authService.notifyAuthChange();
      authService.redirectToHome();
    } catch (err) {
      console.error("Logout error:", err);
      setError("Wystąpił błąd podczas wylogowywania.");
      // Still redirect on error
      authService.redirectToHome();
    }
  }, []);

  useEffect(() => {
    // Initial auth check
    refreshAuth();

    const handlers: (() => void)[] = [];

    if (refreshOnFocus) {
      const handleFocus = () => {
        refreshAuth();
      };
      window.addEventListener("focus", handleFocus);
      handlers.push(() => window.removeEventListener("focus", handleFocus));
    }

    if (listenToAuthEvents) {
      const handleAuthChange = () => {
        refreshAuth();
      };
      window.addEventListener("authChange", handleAuthChange);
      handlers.push(() => window.removeEventListener("authChange", handleAuthChange));
    }

    return () => {
      handlers.forEach((cleanup) => cleanup());
    };
  }, [refreshAuth, refreshOnFocus, listenToAuthEvents]);

  return {
    ...authState,
    refreshAuth,
    logout,
    error,
  };
};
