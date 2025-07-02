export interface AuthProfile {
  email: string;
  id: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  userId: string | null;
  isLoading: boolean;
}

class AuthService {
  /**
   * Check if user is authenticated by calling the profile API
   */
  async checkAuthStatus(): Promise<{ isAuthenticated: boolean; userEmail: string | null; userId: string | null }> {
    try {
      const response = await fetch("/api/user/profile", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 200) {
        const profileData: AuthProfile = await response.json();
        return {
          isAuthenticated: true,
          userEmail: profileData.email,
          userId: profileData.id,
        };
      } else {
        return {
          isAuthenticated: false,
          userEmail: null,
          userId: null,
        };
      }
    } catch (error) {
      console.warn("Auth check failed:", error);
      return {
        isAuthenticated: false,
        userEmail: null,
        userId: null,
      };
    }
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Logout failed:", errorText);
        return { success: false, error: errorText };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Logout error:", error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Emit a custom event to notify about authentication changes
   */
  notifyAuthChange(): void {
    window.dispatchEvent(new CustomEvent("authChange"));
  }

  /**
   * Redirect to home page
   */
  redirectToHome(): void {
    window.location.href = "/";
  }
}

export const authService = new AuthService();
