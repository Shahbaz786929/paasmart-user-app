import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";

export type WalletTransaction = {
  id: number;
  userId: number;
  amount: number;
  type: "REFERRAL_BONUS" | "WELCOME_BONUS" | "ORDER_PAYMENT" | "REFUND";
  description: string;
  orderId: number | null;
  createdAt: string;
};

const WALLET_BASE = `${API_ORIGIN}/api`;

export function getWalletBalance(token: string): Promise<number> {
  return apiRequest<{ balance: number }>("/wallet/balance", { token, baseUrl: WALLET_BASE }).then((r) => r.balance);
}

export function getWalletHistory(token: string): Promise<WalletTransaction[]> {
  return apiRequest<WalletTransaction[]>("/wallet/history", { token, baseUrl: WALLET_BASE });
}