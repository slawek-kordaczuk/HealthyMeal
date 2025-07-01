import { useState, useEffect } from "react";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userId: null,
    error: null,
  });

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Check authentication by trying to access protected API
        const response = await fetch("/api/preferences", {
          method: "GET",
          credentials: "include",
        });

        // If we get 401, user is not authenticated
        // If we get 200 or 404 (no preferences), user is authenticated
        const isUserAuthenticated = response.status !== 401;

        if (!isUserAuthenticated) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            userId: null,
            error: null,
          });
          return;
        }

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          userId: "authenticated", // For now, we don't need the specific userId
          error: null,
        });
      } catch (err) {
        console.error("Error checking authentication:", err);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          userId: null,
          error: "Wystąpił błąd podczas pobierania sesji użytkownika.",
        });
      }
    };

    checkAuthentication();
  }, []);

  return authState;
};
