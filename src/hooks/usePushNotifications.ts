import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { savePushToken } from "../api/auth";
import { getAuthToken } from "../utils/authStorage";
import { registerForPushNotificationsAsync } from "../utils/pushNotifications";
import { registerWebPush } from "../utils/webPushRegistration";

export function usePushNotifications() {
  const router = useRouter();
  const responseListenerRef = useRef<any>(null);

  // Platform ke hisaab se sahi registration flow chalao
  useEffect(() => {
    const setup = async () => {
      const authToken = await getAuthToken();
      if (!authToken) return;

      if (Platform.OS === "web") {
        try {
          await registerWebPush(authToken);
        } catch (err) {
          console.warn("Web push registration failed", err);
        }
        return;
      }

      const pushToken = await registerForPushNotificationsAsync();
      if (!pushToken) return;
      try {
        await savePushToken(authToken, pushToken);
      } catch (err) {
        console.warn("Could not save push token to backend", err);
      }
    };

    setup();
  }, []);

  // Native (Android/iOS) par notification tap → deep link.
  // Web par ye kaam service-worker.js ke andar already ho raha hai.
  useEffect(() => {
    if (Platform.OS === "web") return;

    const handleNavigation = (data: Record<string, any> | undefined) => {
      if (!data) return;
      const { type, referenceId } = data;

      if ((type === "ORDER_UPDATE" || type === "RETURN_REQUEST" || type === "CHAT_MESSAGE") && referenceId) {
        router.push(`/order/${referenceId}` as any);
      } else if (type === "WALLET") {
        router.push("/wallet" as any);
      } else if (type === "WISHLIST" && referenceId) {
        router.push(`/product/${referenceId}` as any);
      } else {
        router.push("/notifications" as any);
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNavigation(response.notification.request.content.data as Record<string, any>);
    });

    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNavigation(response.notification.request.content.data as Record<string, any>);
    });

    return () => {
      responseListenerRef.current?.remove();
    };
  }, [router]);
}