import { api } from "@/utils/api-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { components } from "@/openapi";

export type PaymentIntentCreate = components["schemas"]["PaymentIntentCreate"];
export type PaymentIntentData = components["schemas"]["PaymentIntentData"];
export type SetupIntentData = components["schemas"]["SetupIntentData"];
export type PaymentMethodsData = components["schemas"]["PaymentMethodsData"];
export type SavedCard = components["schemas"]["SavedCard"];

export async function createPaymentIntent(
  payload: PaymentIntentCreate,
): Promise<PaymentIntentData> {
  const { data, error } = await api.POST("/payments/intent", { body: payload });
  if (error || !data) throw error ?? new Error("Empty payment intent response");
  return data;
}

export function useCreatePaymentIntentMutation() {
  return useMutation({ mutationFn: createPaymentIntent });
}

export async function createSetupIntent(): Promise<SetupIntentData> {
  const { data, error } = await api.POST("/payments/setup-intent", {});
  if (error || !data) throw error ?? new Error("Empty setup intent response");
  return data;
}

export function useCreateSetupIntentMutation() {
  return useMutation({ mutationFn: createSetupIntent });
}

export async function getPaymentMethods(): Promise<PaymentMethodsData> {
  const { data, error } = await api.GET("/payments/methods");
  if (error || !data) throw error ?? new Error("Could not load payment methods");
  return data;
}

export function usePaymentMethodsQuery() {
  return useQuery({ queryKey: ["paymentMethods"], queryFn: getPaymentMethods });
}
