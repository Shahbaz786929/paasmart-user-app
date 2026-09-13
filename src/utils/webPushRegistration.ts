import { Platform } from "react-native";
import { getVapidPublicKey, subscribeWebPush } from "../api/webPush";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function registerWebPush(authToken: string): Promise<void> {
  if (Platform.OS !== "web") return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("This browser doesn't support push notifications.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("Notification permission not granted.");
    return;
  }

  const registration = await navigator.serviceWorker.register("/service-worker.js");
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const publicKey = await getVapidPublicKey();
    if (!publicKey) {
      console.warn("VAPID public key not configured on backend.");
      return;
    }
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const json = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await subscribeWebPush(authToken, { endpoint: json.endpoint, keys: json.keys });
}