import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { colors } from "../../theme/colors";

export default function TabsLayout() {
  const { itemCount, refreshCartCount } = useCart();
  usePushNotifications();

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: "rgba(10,10,10,1)",
          borderTopColor: colors.surfaceBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarBadgeStyle: {
          backgroundColor: colors.primary,
          color: colors.white,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="categories"
        options={{ title: "Categories", tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: "Orders", tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: "Account", tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }}
      />
    </Tabs>
  );
}