import React, { useState, useEffect } from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import type { NavigationLinkItem } from "@/types/types";

/**
 * NavigationMenuContainer component renders the main navigation menu
 * for the HealthyMeal application using Shadcn/ui components.
 * Displays different menu items based on authentication status.
 */
export function NavigationMenuContainer() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status using actual session from server
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Try accessing a protected API endpoint to check if user is authenticated
        const response = await fetch("/api/preferences", {
          method: "GET",
          credentials: "include",
        });

        // If we get 401, user is not authenticated
        // If we get 200 or 404 (no preferences), user is authenticated
        const isAuth = response.status !== 401;
        setIsAuthenticated(isAuth);
      } catch (error) {
        console.warn("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Define navigation links for authenticated users
  const authenticatedNavLinks: NavigationLinkItem[] = [
    { label: "HealthyMeal", href: "/" }, // Logo/Home page
    { label: "Moje Przepisy", href: "/recipes" },
    { label: "Dodaj Przepis", href: "/add-recipe" },
    { label: "Preferencje", href: "/preferences" },
  ];

  // Define navigation links for non-authenticated users
  const nonAuthenticatedNavLinks: NavigationLinkItem[] = [
    { label: "HealthyMeal", href: "/" }, // Logo/Home page only
  ];

  const currentNavLinks = isAuthenticated ? authenticatedNavLinks : nonAuthenticatedNavLinks;

  const handleLogout = async () => {
    try {
      // Call logout API endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Logout failed:", await response.text());
      }

      // Redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if API call failed
      window.location.href = "/";
    }
  };

  // Show minimal layout during very brief loading to prevent FOUC
  if (isLoading) {
    return (
      <div className="flex h-16 items-center justify-between w-full">
        {/* Left spacer for centering */}
        <div className="flex-1"></div>

        {/* Always show centered logo during loading */}
        <NavigationMenu className="max-w-none">
          <NavigationMenuList className="flex-row">
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <a
                  href="/"
                  className="inline-flex h-9 w-max items-center justify-center rounded-md 
                    px-3 md:px-4 py-2 text-sm font-medium transition-colors
                    hover:bg-accent hover:text-accent-foreground 
                    focus:bg-accent focus:text-accent-foreground 
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
                    font-bold text-primary text-lg md:text-xl"
                  data-astro-prefetch
                >
                  HealthyMeal
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Very subtle loading placeholder on right */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="h-9 w-16 bg-transparent rounded-md hidden sm:block"></div>
          <div className="h-9 w-20 bg-transparent rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-16 items-center justify-between w-full">
      {/* Conditional layout based on authentication status */}
      {!isAuthenticated ? (
        // Non-authenticated layout: HealthyMeal centered, auth buttons on right
        <>
          {/* Left spacer for centering */}
          <div className="flex-1"></div>

          {/* Centered HealthyMeal logo */}
          <NavigationMenu className="max-w-none">
            <NavigationMenuList className="flex-row">
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <a
                    href="/"
                    className="inline-flex h-9 w-max items-center justify-center rounded-md 
                      px-3 md:px-4 py-2 text-sm font-medium transition-colors
                      hover:bg-accent hover:text-accent-foreground 
                      focus:bg-accent focus:text-accent-foreground 
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
                      font-bold text-primary text-lg md:text-xl"
                    data-astro-prefetch
                  >
                    HealthyMeal
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Auth buttons on right */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <a href="/login" data-astro-prefetch>
                Zaloguj się
              </a>
            </Button>

            <Button size="sm" asChild>
              <a href="/register" data-astro-prefetch>
                Zarejestruj się
              </a>
            </Button>

            {/* Mobile menu button - placeholder for future mobile menu implementation */}
            <div className="sm:hidden ml-2">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        // Authenticated layout: Navigation links on left, user actions on right
        <>
          {/* Main Navigation Links */}
          <NavigationMenu className="max-w-none">
            <NavigationMenuList className="flex-row gap-2 md:gap-6">
              {currentNavLinks.map((link, index) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink asChild>
                    <a
                      href={link.href}
                      className={`
                        inline-flex h-9 w-max items-center justify-center rounded-md 
                        px-3 md:px-4 py-2 text-sm font-medium transition-colors
                        hover:bg-accent hover:text-accent-foreground 
                        focus:bg-accent focus:text-accent-foreground 
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        ${index === 0 ? "font-bold text-primary text-lg md:text-xl" : ""}
                        ${index > 0 ? "hidden sm:inline-flex" : ""}
                      `}
                      data-astro-prefetch
                    >
                      {link.icon && <span className="mr-2">{link.icon}</span>}
                      {link.label}
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Authenticated user actions */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:inline">Zalogowany</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Wyloguj się
            </Button>

            {/* Mobile menu button - placeholder for future mobile menu implementation */}
            <div className="sm:hidden ml-2">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
