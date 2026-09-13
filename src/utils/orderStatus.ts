import { Ionicons } from "@expo/vector-icons";
import { OrderStatus } from "../api/orders";
import { colors } from "../theme/colors";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: "Order Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for Pickup",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "Out for Delivery",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function getStatusColor(status: OrderStatus): string {
  if (status === "CANCELLED") return colors.error;
  if (status === "DELIVERED" || status === "COMPLETED") return colors.primary;
  return colors.warning;
}

export function canCancelOrder(status: OrderStatus): boolean {
  return status === "PLACED" || status === "CONFIRMED";
}

// Order abhi active hai (track karne layak) ya terminal state me pahuch chuka hai
export function isActiveOrder(status: OrderStatus): boolean {
  return status !== "DELIVERED" && status !== "COMPLETED" && status !== "CANCELLED";
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Order ke real lifecycle stages — CANCELLED/COMPLETED alag handle hote hain (terminal states)
export type OrderStage = Exclude<OrderStatus, "COMPLETED" | "CANCELLED">;

export const ORDER_STAGES: { status: OrderStage; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: "PLACED", label: "Order Placed", icon: "receipt-outline" },
  { status: "CONFIRMED", label: "Confirmed", icon: "checkmark-circle-outline" },
  { status: "PREPARING", label: "Preparing", icon: "cube-outline" },
  { status: "READY_FOR_PICKUP", label: "Ready for Pickup", icon: "bag-check-outline" },
  { status: "PICKED_UP", label: "Picked Up", icon: "bicycle-outline" },
  { status: "IN_TRANSIT", label: "Out for Delivery", icon: "navigate-outline" },
  { status: "DELIVERED", label: "Delivered", icon: "home-outline" },
];

// CANCELLED ke liye -1 return karta hai (special case, caller handle karega)
export function getActiveStageIndex(status: OrderStatus): number {
  if (status === "CANCELLED") return -1;
  const effective = status === "COMPLETED" ? "DELIVERED" : status;
  return ORDER_STAGES.findIndex((s) => s.status === effective);
}