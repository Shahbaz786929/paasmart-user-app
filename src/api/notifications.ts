import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";

export type NotificationType =
  | "ORDER_UPDATE"
  | "NEW_ORDER"
  | "SHOP_STATUS"
  | "RETURN_REQUEST"
  | "CHAT_MESSAGE"
  | "WISHLIST"
  | "WALLET"
  | "PROMOTION"
  | "GENERAL";

export type AppNotification = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
};

const NOTIFICATIONS_BASE = `${API_ORIGIN}/api`;

export function getMyNotifications(token: string): Promise<AppNotification[]> {
  return apiRequest<AppNotification[]>("/notifications", { token, baseUrl: NOTIFICATIONS_BASE });
}

export function getUnreadNotificationCount(token: string): Promise<number> {
  return apiRequest<{ count: number }>("/notifications/unread-count", { token, baseUrl: NOTIFICATIONS_BASE }).then((res) => res.count);
}

export function markNotificationRead(token: string, notificationId: number): Promise<AppNotification> {
  return apiRequest<AppNotification>(`/notifications/${notificationId}/read`, { method: "POST", token, baseUrl: NOTIFICATIONS_BASE });
}

export function markAllNotificationsRead(token: string): Promise<void> {
  return apiRequest<void>("/notifications/read-all", { method: "POST", token, baseUrl: NOTIFICATIONS_BASE });
}