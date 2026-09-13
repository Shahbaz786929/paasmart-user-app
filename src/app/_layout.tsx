import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
  return (
    <CartProvider>
      <StatusBar barStyle="light-content" />
      <Stack screenOptions={{ headerShown: false }} />
    </CartProvider>
  );
}