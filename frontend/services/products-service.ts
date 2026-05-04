import type { components } from "@/openapi";
import { api } from "@/utils/api-client";
import { useQuery } from "@tanstack/react-query";

export type Product = components["schemas"]["Product"];

// Get all products
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await api.GET("/products");
  if (error || !data) throw error ?? new Error("Empty products response");
  return data.items;
}

export function useProductsQuery() {
  return useQuery({ queryKey: ["products"], queryFn: getProducts });
}

export async function getProductById(productId: string): Promise<Product> {
  const { data, error } = await api.GET("/products/{product_id}", {
    params: { path: { product_id: productId } },
  });
  if (error || !data) throw error ?? new Error("Empty product response");
  return data;
}

export function useProductDetailsQuery(productId: string) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProductById(productId),
    enabled: !!productId,
  });
}
