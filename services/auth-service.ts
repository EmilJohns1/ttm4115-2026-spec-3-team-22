import type { components } from "@/openapi";
import { api } from "@/utils/api-client";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

export type AuthSessionUser = { id: string; name: string; email: string };
export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};
export type AuthSession = { user: AuthSessionUser; tokens: AuthTokens };

export const loginFormSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerFormSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

async function getTokens(email: string, password: string): Promise<AuthTokens> {
  const { data, error } = await api.POST("/auth/jwt/login", {
    body: { username: email, password, scope: "" },
    bodySerializer: (body) =>
      new URLSearchParams(body as Record<string, string>).toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (error) throw error;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
  };
}

export async function loginUser(
  payload: LoginFormValues,
): Promise<AuthSession> {
  const tokens = await getTokens(payload.email, payload.password);
  console.log("Tokens", tokens);
  const { data, error } = await api.GET("/users/me", {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (error || !data) throw error ?? new Error("Empty user response");
  return {
    user: { id: data.id, name: data.name, email: data.email },
    tokens,
  };
}

export async function registerUser(
  payload: RegisterFormValues,
): Promise<AuthSession> {
  const body: components["schemas"]["UserCreate"] = {
    email: payload.email,
    password: payload.password,
    name: payload.name,
    is_active: true,
    is_superuser: false,
    is_verified: false,
  };
  const { data: userData, error: registerError } = await api.POST(
    "/auth/register",
    { body },
  );
  if (registerError) throw registerError;

  const tokens = await getTokens(payload.email, payload.password);
  return {
    user: { id: userData.id, name: userData.name, email: userData.email },
    tokens,
  };
}

export function useLoginMutation() {
  return useMutation({ mutationFn: loginUser });
}

export function useRegisterMutation() {
  return useMutation({ mutationFn: registerUser });
}
