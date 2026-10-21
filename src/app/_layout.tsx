import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import { setUnauthorizedHandler } from "../api/client";
import { CartProvider } from "../context/CartContext";
import { clearAuthSession } from "../utils/authStorage";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await clearAuthSession();
      router.replace("/(auth)/login" as any);
    });
    return () => setUnauthorizedHandler(null);
  }, [router]);

  return (
    <CartProvider>
      <StatusBar barStyle="light-content" />
      <Stack screenOptions={{ headerShown: false }} />
    </CartProvider>
  );
}