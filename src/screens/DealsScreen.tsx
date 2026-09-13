import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "../api/client";
import { ActiveDeal, getLiveDeals } from "../api/deals";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getTimeRemaining } from "../utils/dealCountdown";
import { getAuthToken } from "@/utils/authStorage";

export function DealsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [deals, setDeals] = useState<ActiveDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [, forceTick] = useState(0);

  const load = useCallback(async () => {
    try {
        const token = await getAuthToken();
      const data = await getLiveDeals(token);
      setDeals(data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load deals.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Countdown text ko live rakhne ke liye har minute re-render
  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingTop: insets.top + scale(16) }}>
          <View style={[styles.headerRow, { paddingHorizontal: scale(20), marginBottom: scale(16) }]}>
            <Pressable onPress={() => router.back()} style={{ marginRight: scale(10) }}>
              <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
            </Pressable>
            <Ionicons name="flash" size={scale(20)} color={colors.warning} style={{ marginRight: scale(6) }} />
            <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy }}>
              Flash Deals
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : error ? (
            <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), paddingHorizontal: scale(20) }}>{error}</Text>
          ) : deals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="flash-off-outline" size={scale(56)} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(12) }}>
                No live deals right now — check back soon!
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
              <View style={styles.grid}>
                {deals.map((deal) => {
                  const timeLeft = getTimeRemaining(deal.endsAt);
                  const isEnded = timeLeft === "Deal ended";

                  return (
                    <Pressable
                      key={deal.flashSaleId}
                      style={[styles.gridItem, { marginBottom: scale(14) }]}
                      onPress={() => router.push(`/product/${deal.productId}` as any)}
                    >
                      <Card style={{ padding: 0, overflow: "hidden" }}>
                        <View style={{ position: "relative" }}>
                          {deal.productImage ? (
                            <Image source={{ uri: deal.productImage }} style={{ width: "100%", height: scale(120) }} resizeMode="cover" />
                          ) : (
                            <View style={[styles.imagePlaceholder, { height: scale(120) }]}>
                              <Ionicons name="cube-outline" size={scale(28)} color={colors.textMuted} />
                            </View>
                          )}
                          <View style={[styles.discountBadge, { borderRadius: scale(6), paddingHorizontal: scale(6), paddingVertical: scale(2) }]}>
                            <Text style={{ color: colors.white, fontSize: scale(typography.size.xs), fontWeight: typography.weight.heavy }}>
                              {deal.discountPercent}% OFF
                            </Text>
                          </View>
                        </View>
                        <View style={{ padding: scale(10) }}>
                          <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                            {deal.productName}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: scale(4) }}>
                            <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.heavy }}>
                              ₹{deal.dealPrice}
                            </Text>
                            <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginLeft: scale(6), textDecorationLine: "line-through" }}>
                              ₹{deal.originalPrice}
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: scale(4) }}>
                            <Ionicons name="time-outline" size={scale(11)} color={isEnded ? colors.error : colors.warning} />
                            <Text style={{ color: isEnded ? colors.error : colors.warning, fontSize: scale(10), marginLeft: scale(3), fontWeight: typography.weight.medium }}>
                              {timeLeft}
                            </Text>
                          </View>
                        </View>
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
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
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48.5%",
  },
  imagePlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.error,
  },
});