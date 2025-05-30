import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Shadcn/ui components
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "../ui/form";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";

// Zod schema for form validation
const registerFormSchema = z
  .object({
    email: z.string().email("Wprowadź poprawny adres email"),
    password: z
      .string()
      .min(8, "Hasło musi zawierać co najmniej 8 znaków")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Hasło musi zawierać co najmniej jedną małą literę, jedną dużą literę i jedną cyfrę"
      ),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export default function RegisterForm({
  onSuccess = () => {
    // Force page reload to ensure middleware picks up the new session
    window.location.href = "/";
  },
  onNavigateToLogin = () => (window.location.href = "/login"),
}: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Call registration API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include", // Important for cookie handling
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas rejestracji");
      }

      // Registration successful
      setSuccessMessage(data.message || "Konto zostało utworzone pomyślnie!");

      // Reset form after successful registration
      form.reset();

      // Redirect after successful registration (with auto-login)
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adres email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="wprowadz@email.com" {...field} />
                </FormControl>
                <FormDescription>Wprowadź swój adres email, który będzie służył do logowania.</FormDescription>
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
                  <Input type="password" placeholder="Wprowadź hasło" {...field} />
                </FormControl>
                <FormDescription>
                  Hasło musi zawierać co najmniej 8 znaków, w tym małą literę, dużą literę i cyfrę.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Potwierdź hasło</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Wprowadź hasło ponownie" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Rejestrowanie..." : "Zarejestruj się"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-gray-600">
        Masz już konto?{" "}
        <button type="button" onClick={onNavigateToLogin} className="text-blue-600 hover:text-blue-500 underline">
          Zaloguj się
        </button>
      </div>
    </div>
  );
}
