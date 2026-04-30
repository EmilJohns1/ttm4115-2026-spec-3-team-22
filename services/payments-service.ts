import { api } from "@/utils/api-client";
import { useMutation } from "@tanstack/react-query";
import type { components } from "@/openapi";

export type PaymentIntentCreate = components["schemas"]["PaymentIntentCreate"];
export type PaymentIntentData = components["schemas"]["PaymentIntentData"];

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
