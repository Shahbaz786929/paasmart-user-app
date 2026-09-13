import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";

export type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

export type ReturnRequest = {
  id: number;
  orderId: number;
  orderItemId: number;
  customerId: number;
  reason: string;
  description: string | null;
  images: string | null;
  status: ReturnStatus;
  rejectionReason: string | null;
  refundAmount: number | null;
  createdAt: string;
  resolvedAt: string | null;
};

const RETURNS_BASE = `${API_ORIGIN}/api`;

export function getMyReturnRequests(token: string): Promise<ReturnRequest[]> {
  return apiRequest<ReturnRequest[]>("/returns/my", { token, baseUrl: RETURNS_BASE });
}

export function getReturnRequestsForOrder(token: string, orderId: number): Promise<ReturnRequest[]> {
  return apiRequest<ReturnRequest[]>(`/returns/order/${orderId}`, { token, baseUrl: RETURNS_BASE });
}

/**
 * Backend multipart/form-data expect karta hai (photos optional bhi accept karta hai),
 * isliye plain JSON apiRequest() ki jagah direct fetch + FormData use kar rahe hain
 * (jaisa addProductReview me kiya tha).
 */
export async function createReturnRequest(
  token: string,
  orderItemId: number,
  reason: string,
  description?: string
): Promise<ReturnRequest> {
  const form = new FormData();
  form.append("orderItemId", String(orderItemId));
  form.append("reason", reason);
  if (description) form.append("description", description);

  const response = await fetch(`${RETURNS_BASE}/returns`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Content-Type manually mat set karo — FormData khud multipart boundary set karega
    },
    body: form,
  });

  const text = await response.text();
  let parsed: any = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // raw text hi rehne do
  }

  if (!response.ok) {
    const message = (parsed && (parsed.message || parsed.error)) || (typeof parsed === "string" ? parsed : "Could not submit return request.");
    throw new Error(message);
  }

  return parsed as ReturnRequest;
}