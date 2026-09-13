import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";

export type Shop = {
  id: number;
  shopName: string;
  category: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  storeSlug: string;
  logoUrl: string | null;
  distanceKm: number | null;
  deliveryRadiusKm: number;
  canDeliver: boolean;
  averageRating: number;
  totalReviews: number;
  estimatedDeliveryMinMinutes: number;
  estimatedDeliveryMaxMinutes: number;
};

export type Product = {
  id: number;
  shopId: number;
  name: string;
  category: string;
  subCategory: string | null;
  price: number;
  discountPercent: number;
  stockQty: number;
  images: string | null;
  description: string | null;
  available: boolean;
};

// Resolves a possibly-relative image path (e.g. "/uploads/xxx.jpg") returned
// by the backend into a full, loadable URL. Absolute URLs (http/https) —
// like the Unsplash stock photos used for demo data — pass through unchanged.
export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path}`;
}

export function getNearbyShops(
  token: string,
  params?: { category?: string; city?: string; lat?: number; lng?: number }
): Promise<Shop[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.city) query.set("city", params.city);
  if (params?.lat != null) query.set("lat", String(params.lat));
  if (params?.lng != null) query.set("lng", String(params.lng));

  const qs = query.toString();
  return apiRequest<Shop[]>(`/shops${qs ? `?${qs}` : ""}`, { token });
}

export function getShopById(token: string, id: number): Promise<Shop> {
  return apiRequest<Shop>(`/shops/${id}`, { token });
}

export function getShopProducts(token: string, id: number): Promise<Product[]> {
  return apiRequest<Product[]>(`/shops/${id}/products`, { token });
}