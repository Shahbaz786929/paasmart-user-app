import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "../api/client";
import { getShopRatings, ShopRatings } from "../api/ratings";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";

function Stars({ value, size }: { value: number; size: number }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= Math.round(value) ? "star" : "star-outline"} size={size} color="#FFC107" />
      ))}
    </View>
  );
}

export function ShopRatingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const { shopId, name } = useLocalSearchParams<{ shopId: string; name?: string }>();

  const [data, setData] = useState<ShopRatings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token || !shopId) {
        router.replace("/(auth)/login" as any);
        return;
      }
      setData(await getShopRatings(token, Number(shopId)));
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load reviews.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shopId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/" as any);
  };

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: scale(20),
            paddingTop: insets.top + scale(16),
            paddingBottom: insets.bottom + scale(30),
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: scale(14) }}>
            <Pressable onPress={goBack} style={{ marginRight: scale(10) }}>
              <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
            </Pressable>
            <Text numberOfLines={1} style={{ flex: 1, color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy }}>
              {name || "Shop"} reviews
            </Text>
          </View>

          {error ? (
            <Text style={{ color: colors.error, marginBottom: scale(12), fontSize: scale(typography.size.sm) }}>{error}</Text>
          ) : null}

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(40) }} />
          ) : data ? (
            <>
              <Card style={{ marginBottom: scale(14), alignItems: "center" }}>
                <Text style={{ color: colors.textPrimary, fontSize: scale(34), fontWeight: typography.weight.heavy }}>
                  {data.totalReviews > 0 ? data.averageRating.toFixed(1) : "New"}
                </Text>
                <Stars value={data.averageRating} size={scale(18)} />
                <Text style={{ color: colors.textMuted, marginTop: scale(6), fontSize: scale(typography.size.sm) }}>
                  {data.totalReviews} {data.totalReviews === 1 ? "review" : "reviews"}
                </Text>
              </Card>

              {data.ratings.length === 0 ? (
                <Card>
                  <Text style={{ color: colors.textMuted, textAlign: "center" }}>No reviews yet.</Text>
                </Card>
              ) : (
                data.ratings.map((r) => (
                  <Card key={r.id} style={{ marginBottom: scale(10) }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: colors.textPrimary, fontWeight: typography.weight.bold }}>{r.customerName}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs) }}>
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </Text>
                    </View>
                    <View style={{ marginTop: scale(4) }}>
                      <Stars value={r.productRating} size={scale(14)} />
                    </View>
                    {r.comment ? (
                      <Text style={{ color: colors.textSecondary, marginTop: scale(8), fontSize: scale(typography.size.sm), lineHeight: scale(19) }}>
                        {r.comment}
                      </Text>
                    ) : null}
                  </Card>
                ))
              )}
            </>
          ) : null}
        </ScrollView>
      </AppScreenContainer>
    </AppBackground>
  );
}