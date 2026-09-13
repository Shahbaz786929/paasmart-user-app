import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";

const WEB_PUSH_BASE = `${API_ORIGIN}/api`;

export function getVapidPublicKey(): Promise<string> {
  return apiRequest<{ publicKey: string }>("/web-push/vapid-public-key", { baseUrl: WEB_PUSH_BASE }).then((res) => res.publicKey);
}

export function subscribeWebPush(
  token: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  return apiRequest<void>("/web-push/subscribe", {
    method: "POST",
    token,
    baseUrl: WEB_PUSH_BASE,
    body: { endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
  });
}

export function unsubscribeWebPush(token: string, endpoint: string): Promise<void> {
  return apiRequest<void>("/web-push/unsubscribe", { method: "POST", token, baseUrl: WEB_PUSH_BASE, body: { endpoint } });
}