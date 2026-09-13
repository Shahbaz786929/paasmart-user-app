import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "../api/client";
import { getMyOrders, Order } from "../api/orders";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";
import { getStatusColor, isActiveOrder, ORDER_STATUS_LABELS } from "../utils/orderStatus";

export function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const data = await getMyOrders(token);
      setOrders(data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load your orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingTop: insets.top + scale(20) }}>
          <View style={[styles.headerRow, { paddingHorizontal: scale(20), marginBottom: scale(16) }]}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.push("/(tabs)/home" as any))}
              style={{ marginRight: scale(10) }}
            >
              <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
            </Pressable>
            <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy }}>
              My Orders
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : error ? (
            <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), paddingHorizontal: scale(20) }}>{error}</Text>
          ) : orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={scale(64)} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(12) }}>
                You haven't placed any orders yet
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }} showsVerticalScrollIndicator={false}>
              {orders.map((order) => (
                <Pressable key={order.id} onPress={() => router.push(`/order/${order.id}` as any)}>
                  <Card style={{ marginBottom: scale(12) }}>
                    <View style={styles.topRow}>
                      <Text style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm) }}>
                        Order #{order.id}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(order.status) + "22", borderColor: getStatusColor(order.status), paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(6) },
                        ]}
                      >
                        <Text style={{ color: getStatusColor(order.status), fontSize: scale(typography.size.xs), fontWeight: typography.weight.bold }}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(6) }}>
                      {formatDate(order.createdAt)} · {order.paymentMode === "COD" ? "Cash on Delivery" : "Paid Online"}
                    </Text>

                    <View style={[styles.bottomRow, { marginTop: scale(10) }]}>
                      <Text style={{ color: colors.primary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.md) }}>
                        ₹{order.totalAmount}
                      </Text>
                      {isActiveOrder(order.status) ? (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/order/${order.id}/track` as any);
                          }}
                          style={{ flexDirection: "row", alignItems: "center" }}
                          hitSlop={6}
                        >
                          <Ionicons name="navigate" size={scale(14)} color={colors.primary} style={{ marginRight: scale(4) }} />
                          <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                            Track Order
                          </Text>
                        </Pressable>
                      ) : (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), marginRight: scale(4) }}>
                            View Details
                          </Text>
                          <Ionicons name="chevron-forward" size={scale(16)} color={colors.textSecondary} />
                        </View>
                      )}
                    </View>
                  </Card>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </AppScreenContainer>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    borderWidth: 1,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});