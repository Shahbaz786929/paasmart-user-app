import { apiRequest } from "./client";

export type RatingPayload = {
  productRating: number;
  deliveryRating?: number;
  comment?: string;
};

export function rateOrder(token: string, orderId: number, payload: RatingPayload): Promise<any> {
  return apiRequest(`/orders/${orderId}/rating`, { method: "POST", token, body: payload });
}