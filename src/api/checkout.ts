import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";

export type CheckoutPayload = {
  addressId: number;
  paymentMethod: "COD" | "ONLINE";
  couponCode?: string;
  useWallet?: boolean;
};

export type CheckoutResult = {
  orderId: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
};

const CHECKOUT_BASE = `${API_ORIGIN}/api`;

export function placeOrder(token: string, payload: CheckoutPayload): Promise<CheckoutResult> {
  return apiRequest<CheckoutResult>("/checkout", {
    method: "POST",
    token,
    baseUrl: CHECKOUT_BASE,
    body: payload,
  });
}