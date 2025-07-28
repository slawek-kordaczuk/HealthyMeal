import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Shadcn/ui components
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Zod schema for form validation
const loginFormSchema = z.object({
  email: z.string().email("Wprowadź poprawny adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

// Export schema for testing purposes
export { loginFormSchema };

interface LoginFormProps {
  onSuccess?: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToRecover?: () => void;
}

export default function LoginForm({
  onSuccess = () => {
    // Get return URL from query params or default to home
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get("returnUrl") || "/";
    // Force page reload to ensure middleware picks up the new session
    window.location.href = returnUrl;
  },
  onNavigateToRegister = () => (window.location.href = "/register"),
  onNavigateToRecover = () => (window.location.href = "/recover-password"),
}: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call login API endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include", // Important for cookie handling
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas logowania");
      }

      // Login successful
      if (onSuccess) {
        // Emit custom event to notify navigation component
        window.dispatchEvent(new CustomEvent("authChange"));
        onSuccess();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas logowania. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" data-testid="login-error-alert">
          <AlertDescription data-testid="login-error-message">{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="login-form">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adres email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="wprowadz@email.com"
                    disabled={isLoading}
                    data-testid="login-email-input"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hasło</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Wprowadź hasło"
                    disabled={isLoading}
                    data-testid="login-password-input"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full" data-testid="login-submit-button">
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>
      </Form>

      <div className="space-y-2 text-center text-sm">
        <button
          type="button"
          onClick={onNavigateToRecover}
          disabled={isLoading}
          className="text-blue-600 hover:text-blue-500 underline disabled:opacity-50"
          data-testid="login-forgot-password-link"
        >
          Zapomniałeś hasła?
        </button>

        <div className="text-gray-600">
          Nie masz konta?{" "}
          <button
            type="button"
            onClick={onNavigateToRegister}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-500 underline disabled:opacity-50"
            data-testid="login-register-link"
          >
            Zarejestruj się
          </button>
        </div>
      </div>
    </div>
  );
}
