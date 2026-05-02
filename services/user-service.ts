import { api } from "@/utils/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { components } from "@/openapi";

export type UserProfile = components["schemas"]["UserRead"];
export type UserUpdate = components["schemas"]["UserUpdate"];

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

export async function updateUser(payload: UserUpdate): Promise<UserProfile> {
  const { data, error } = await api.PATCH("/users/me", { body: payload });
  if (error || !data) throw error ?? new Error("Failed to update user");
  return data;
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
