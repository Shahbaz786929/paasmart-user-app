import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";

const CHECKOUT_BASE = `${API_ORIGIN}/api`;

export type DeliveryFeePreview = {
  deliveryFee: number;
  distanceKm: number;
};

// Ye ab addressId ke hisaab se ACTUAL distance-based fee deta hai —
// checkout ke charge se hamesha match karega
export function getDeliveryFeePreview(token: string, addressId: number): Promise<DeliveryFeePreview> {
  return apiRequest<DeliveryFeePreview>(`/checkout/delivery-fee-preview?addressId=${addressId}`, {
    token,
    baseUrl: CHECKOUT_BASE,
  });
}