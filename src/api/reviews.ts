import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";

export type ProductReview = {
  id: number;
  productId: number;
  customerId: number;
  orderId: number;
  rating: number;
  reviewText: string | null;
  images: string | null;
  sellerReply: string | null;
  sellerRepliedAt: string | null;
  helpfulCount: number;
  createdAt: string;
};

export type ProductReviewSummary = {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<string, number>;
  reviews: ProductReview[];
};

const REVIEWS_BASE = `${API_ORIGIN}/api`;

export function getProductReviews(productId: number, token?: string | null): Promise<ProductReviewSummary> {
  return apiRequest<ProductReviewSummary>(`/products/${productId}/reviews`, { token, baseUrl: REVIEWS_BASE });
}

export function markReviewHelpful(token: string, reviewId: number): Promise<ProductReview> {
  return apiRequest<ProductReview>(`/reviews/${reviewId}/helpful`, { method: "POST", token, baseUrl: REVIEWS_BASE });
}

/**
 * Submits a product review. This endpoint expects multipart/form-data
 * (it also accepts photo uploads on the backend), so it can't go through
 * the plain JSON apiRequest() helper — we build FormData directly instead.
 */
export async function addProductReview(
  token: string,
  productId: number,
  orderId: number,
  rating: number,
  reviewText?: string
): Promise<ProductReview> {
  const form = new FormData();
  form.append("orderId", String(orderId));
  form.append("rating", String(rating));
  if (reviewText) form.append("reviewText", reviewText);

  const response = await fetch(`${REVIEWS_BASE}/products/${productId}/reviews`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type manually — the browser/RN needs to set the
      // multipart boundary itself based on the FormData object.
    },
    body: form,
  });

  const text = await response.text();
  let parsed: any = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // leave as raw text
  }

  if (!response.ok) {
    const message = (parsed && (parsed.message || parsed.error)) || (typeof parsed === "string" ? parsed : "Could not submit review.");
    throw new Error(message);
  }

  return parsed as ProductReview;
}