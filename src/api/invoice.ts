import { API_ORIGIN } from "./config";

export function getInvoiceUrl(orderId: number): string {
  return `${API_ORIGIN}/api/orders/${orderId}/invoice`;
}