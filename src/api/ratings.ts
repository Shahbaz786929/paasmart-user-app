import { apiRequest } from "./client";

export type ShopRatingItem = {
  id: number;
  customerName: string;
  productRating: number;
  deliveryRating: number | null;
  comment: string | null;
  createdAt: string;
};

export type ShopRatings = {
  averageRating: number;
  totalReviews: number;
  ratings: ShopRatingItem[];
};

// GET /api/v1/shops/{id}/ratings
export function getShopRatings(token: string, shopId: number): Promise<ShopRatings> {
  return apiRequest<ShopRatings>(`/shops/${shopId}/ratings`, { token });
}