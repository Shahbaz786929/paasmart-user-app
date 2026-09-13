import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";
import type { Product, Shop } from "./shops";

export type SearchResult = {
  shops: Shop[];
  products: Product[];
};

const SEARCH_BASE = `${API_ORIGIN}/api`;

export function search(token: string | null, query: string, lat?: number, lng?: number): Promise<SearchResult> {
  const params = new URLSearchParams({ q: query });
  if (lat != null) params.set("lat", String(lat));
  if (lng != null) params.set("lng", String(lng));

  return apiRequest<SearchResult>(`/search?${params.toString()}`, { token, baseUrl: SEARCH_BASE });
}