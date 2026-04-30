import { api } from "@/utils/api-client";
import { useQuery } from "@tanstack/react-query";
import type { components } from "@/openapi";

export type UserProfile = components["schemas"]["UserRead"];

export async function getUserDetails(): Promise<UserProfile> {
  const { data, error } = await api.GET("/users/me", {});
  if (error || !data) throw error ?? new Error("Empty user response");
  return data;
}

export function useUserDetailsQuery(enabled = true) {
  return useQuery({
    queryKey: ["user"],
    queryFn: getUserDetails,
    enabled,
  });
}
