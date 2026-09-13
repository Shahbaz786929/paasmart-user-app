import { apiRequest } from "./client";
import type { Product } from "./shops";

export function getProducts(token: string, category?: string): Promise<Product[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiRequest<Product[]>(`/products${qs}`, { token });
}

export function getProductById(token: string, id: number): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`, { token });
}