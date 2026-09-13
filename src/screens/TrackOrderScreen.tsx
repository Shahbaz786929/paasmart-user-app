import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError } from "../api/client";
import { DeliveryLocation, getDeliveryLocation, getOrderDetail, getOrderTimeline, Order, OrderStatusHistoryEntry } from "../api/orders";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { DeliveryMap } from "../components/DeliveryMap";
import { OrderTimelineTracker } from "../components/OrderTimelineTracker";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";
import { getDistanceKm, getEtaMinutes } from "../utils/geo";
import { getStatusColor, isActiveOrder, ORDER_STATUS_LABELS } from "../utils/orderStatus";

const POLL_INTERVAL_MS = 15000;

export function TrackOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistoryEntry[]>([]);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const token = await getAuthToken();
        if (!token || !id) return;
        const [detail, timeline, location] = await Promise.all([
          getOrderDetail(token, Number(id)),
          getOrderTimeline(token, Number(id)),
          getDeliveryLocation(token, Number(id)).catch(() => null),
        ]);
        setOrder(detail.order);
        setHistory(timeline);
        setDeliveryLocation(location);
        setError("");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load tracking info.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useFocusEffect(
    useCallback(() => {
      load();

      // Active order hai to har 15s me quietly refresh karte raho (live-ish tracking feel)
      pollRef.current = setInterval(() => {
        load(true);
      }, POLL_INTERVAL_MS);

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingTop: insets.top + scale(16) }}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: scale(20), marginBottom: scale(16) }}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.push(`/order/${id}` as any))}
              style={{ marginRight: scale(10) }}
            >
              <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
            </Pressable>
            <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy }}>
              Track Order
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : error ? (
            <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), paddingHorizontal: scale(20) }}>{error}</Text>
          ) : order ? (
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
              {/* Status banner */}
              <Card style={{ marginBottom: scale(16), alignItems: "center", paddingVertical: scale(20) }}>
                <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs) }}>Order #{order.id}</Text>
                <Text
                  style={{
                    color: getStatusColor(order.status),
                    fontSize: scale(typography.size.lg),
                    fontWeight: typography.weight.heavy,
                    marginTop: scale(6),
                  }}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </Text>

                {order.otp && isActiveOrder(order.status) ? (
                  <View
                    style={{
                      marginTop: scale(14),
                      backgroundColor: colors.primaryLight,
                      borderRadius: scale(10),
                      paddingHorizontal: scale(16),
                      paddingVertical: scale(10),
                    }}
                  >
                    <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), textAlign: "center" }}>
                      Delivery OTP
                    </Text>
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: scale(typography.size.xl),
                        fontWeight: typography.weight.heavy,
                        letterSpacing: scale(4),
                        textAlign: "center",
                      }}
                    >
                      {order.otp}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), textAlign: "center", marginTop: scale(2) }}>
                      Delivery partner ko handover ke waqt share karein
                    </Text>
                  </View>
                ) : null}
              </Card>

              {deliveryLocation?.available && order.deliveryLat && order.deliveryLng ? (
                <Card style={{ marginBottom: scale(16), padding: 0, overflow: "hidden" }}>
                  <DeliveryMap
                    deliveryLat={deliveryLocation.lat!}
                    deliveryLng={deliveryLocation.lng!}
                    destinationLat={order.deliveryLat}
                    destinationLng={order.deliveryLng}
                    height={scale(220)}
                  />
                  <View style={{ padding: scale(14) }}>
                    <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                      {(() => {
                        const dist = getDistanceKm(deliveryLocation.lat!, deliveryLocation.lng!, order.deliveryLat, order.deliveryLng);
                        return `${dist.toFixed(1)} km away · approx ${getEtaMinutes(dist)} min`;
                      })()}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }}>
                      Your delivery partner is on the way
                    </Text>
                  </View>
                </Card>
              ) : null}

              {/* Timeline */}
              <Card style={{ marginBottom: scale(16) }}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: scale(typography.size.md),
                    fontWeight: typography.weight.bold,
                    marginBottom: scale(16),
                  }}
                >
                  Order Timeline
                </Text>
                <OrderTimelineTracker status={order.status} history={history} />
              </Card>

              {/* Delivery address */}
              <Card>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <Ionicons name="location" size={scale(18)} color={colors.primary} style={{ marginTop: scale(2) }} />
                  <View style={{ marginLeft: scale(10), flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                      Delivering to
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), marginTop: scale(2) }}>
                      {order.deliveryAddress}
                    </Text>
                  </View>
                </View>
              </Card>
            </ScrollView>
          ) : null}
        </View>
      </AppScreenContainer>
    </AppBackground>
  );
}