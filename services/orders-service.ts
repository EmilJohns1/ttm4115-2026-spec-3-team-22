import type { components } from "@/openapi";
import { api } from "@/utils/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Order = components["schemas"]["Order"];
export type OrderCreate = components["schemas"]["OrderCreate"];

export type OrderStatus = "active" | "completed" | "cancelled";

export type OrderTracking = {
  orderId: string;
  status: string;
  statusLabel: string;
  drone: { latitude: number; longitude: number } | null;
  destination: { latitude: number; longitude: number };
};

export async function createOrder(payload: OrderCreate): Promise<Order> {
  const { data, error } = await api.POST("/orders/", { body: payload });
  if (error || !data) throw error ?? new Error("Empty order response");
  return data;
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "section"] });
    },
  });
}

async function getOrders(
  status: OrderStatus = "active",
  limit?: number,
): Promise<Order[]> {
  const { data, error } = await api.GET("/orders/", {
    params: { query: { status, limit } },
  });
  if (error || !data) throw error ?? new Error("Empty orders response");
  return data.items;
}

export function useOrdersQuery(status: OrderStatus, limit?: number) {
  return useQuery({
    queryKey: ["orders", "section", status, limit],
    queryFn: () => getOrders(status, limit),
  });
}

export async function getOrderById(orderId: string): Promise<Order> {
  const { data, error } = await api.GET("/orders/{order_id}", {
    params: { path: { order_id: orderId } },
  });
  if (error || !data) throw error ?? new Error("Empty order response");
  return data;
}

export function useOrderDetailsQuery(orderId: string) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  });
}

export async function getOrderTracking(
  orderId: string,
): Promise<OrderTracking> {
  const { data, error } = await api.GET("/orders/{order_id}/tracking", {
    params: { path: { order_id: orderId } },
  });
  if (error || !data) throw error ?? new Error("Empty tracking response");
  return data as OrderTracking;
}

export function useOrderTrackingQuery(orderId: string, shouldPoll: boolean) {
  return useQuery({
    queryKey: ["order-tracking", orderId],
    queryFn: () => getOrderTracking(orderId),
    enabled: !!orderId,
    refetchInterval: shouldPoll ? 5000 : false,
  });
}
