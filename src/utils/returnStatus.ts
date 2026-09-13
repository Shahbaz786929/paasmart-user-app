import { ReturnStatus } from "../api/returns";
import { colors } from "../theme/colors";

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  PENDING: "Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REFUNDED: "Refunded",
};

export function getReturnStatusColor(status: ReturnStatus): string {
  if (status === "REJECTED") return colors.error;
  if (status === "REFUNDED" || status === "APPROVED") return colors.primary;
  return colors.warning;
}

export const RETURN_REASONS = [
  "Item damaged or defective",
  "Wrong item delivered",
  "Item not as described",
  "Missing parts or accessories",
  "Size or fit issue",
  "No longer needed",
  "Other",
];

export function canRequestReturn(orderStatus: string, deliveredAt: string | null): boolean {
  if (orderStatus !== "DELIVERED" && orderStatus !== "COMPLETED") return false;
  if (!deliveredAt) return false;
  const deliveredDate = new Date(deliveredAt);
  const windowEnd = new Date(deliveredDate);
  windowEnd.setDate(windowEnd.getDate() + 7);
  return new Date() <= windowEnd;
}