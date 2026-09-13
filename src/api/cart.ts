import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";

export type CartItem = {
  cartId: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
};

// Cart lives at /api/cart (not under /api/v1), so every call overrides baseUrl.
const CART_BASE = `${API_ORIGIN}/api`;

export function addToCart(token: string, productId: number, quantity: number = 1): Promise<CartItem> {
  return apiRequest<CartItem>("/cart/add", {
    method: "POST",
    token,
    baseUrl: CART_BASE,
    body: { productId, quantity },
  });
}

export function getCart(token: string): Promise<CartItem[]> {
  return apiRequest<CartItem[]>("/cart", { token, baseUrl: CART_BASE });
}

export function updateCartQuantity(token: string, cartId: number, quantity: number): Promise<CartItem> {
  return apiRequest<CartItem>(`/cart/${cartId}?quantity=${quantity}`, {
    method: "PUT",
    token,
    baseUrl: CART_BASE,
  });
}

export function removeFromCart(token: string, cartId: number): Promise<string> {
  return apiRequest<string>(`/cart/${cartId}`, { method: "DELETE", token, baseUrl: CART_BASE });
}

export function clearCart(token: string): Promise<string> {
  return apiRequest<string>("/cart/clear", { method: "DELETE", token, baseUrl: CART_BASE });
}