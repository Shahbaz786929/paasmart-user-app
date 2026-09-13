import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";

export type ChatMessage = {
  id: number;
  conversationId: number;
  senderId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type ConversationSummary = {
  conversationId: number;
  orderId: number;
  otherPartyName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

const CHAT_BASE = `${API_ORIGIN}/api`;

export function getMessages(token: string, orderId: number): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(`/chat/order/${orderId}/messages`, { token, baseUrl: CHAT_BASE });
}

export function sendChatMessage(token: string, orderId: number, message: string): Promise<ChatMessage> {
  return apiRequest<ChatMessage>(`/chat/order/${orderId}/messages`, {
    method: "POST",
    token,
    baseUrl: CHAT_BASE,
    body: { message },
  });
}

export function getMyConversations(token: string): Promise<ConversationSummary[]> {
  return apiRequest<ConversationSummary[]>("/chat/customer/conversations", { token, baseUrl: CHAT_BASE });
}