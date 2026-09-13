import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";
import type { Product } from "./shops";

export type WishlistItem = {
  id: number;
  product: Product;
  createdAt: string;
};

const WISHLIST_BASE = `${API_ORIGIN}/api`;

export function getWishlist(token: string): Promise<WishlistItem[]> {
  return apiRequest<WishlistItem[]>("/wishlist", { token, baseUrl: WISHLIST_BASE });
}

export function addToWishlist(token: string, productId: number): Promise<WishlistItem> {
  return apiRequest<WishlistItem>("/wishlist", { method: "POST", token, baseUrl: WISHLIST_BASE, body: { productId } });
}

export function removeFromWishlist(token: string, wishlistId: number): Promise<string> {
  return apiRequest<string>(`/wishlist/${wishlistId}`, { method: "DELETE", token, baseUrl: WISHLIST_BASE });
}