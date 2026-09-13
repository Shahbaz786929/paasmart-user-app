import { apiRequest } from "./client";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type Order = {
  id: number;
  customerId: number;
  shopId: number;
  deliveryBoyId: number | null;
  tenantId: number;
  status: OrderStatus;
  paymentMode: "COD" | "ONLINE";
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  otp: string | null;
  createdAt: string;
  deliveredAt: string | null;
};

export type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type OrderStatusHistoryEntry = {
  id: number;
  orderId: number;
  status: OrderStatus;
  changedById: number;
  note: string;
  createdAt: string;
};

export function getMyOrders(token: string): Promise<Order[]> {
  return apiRequest<Order[]>("/orders/my", { token });
}

export function getOrderDetail(token: string, id: number): Promise<{ order: Order; items: OrderItem[] }> {
  return apiRequest<{ order: Order; items: OrderItem[] }>(`/orders/${id}`, { token });
}

export function cancelOrder(token: string, id: number): Promise<string> {
  return apiRequest<string>(`/orders/${id}/cancel`, { method: "POST", token });
}

export function getOrderTimeline(token: string, id: number): Promise<OrderStatusHistoryEntry[]> {
  return apiRequest<OrderStatusHistoryEntry[]>(`/orders/${id}/timeline`, { token });
}

export type DeliveryLocation = {
  lat: number | null;
  lng: number | null;
  updatedAt: string | null;
  available: boolean;
};

export function getDeliveryLocation(token: string, orderId: number): Promise<DeliveryLocation> {
  return apiRequest<DeliveryLocation>(`/orders/${orderId}/delivery-location`, { token });
}