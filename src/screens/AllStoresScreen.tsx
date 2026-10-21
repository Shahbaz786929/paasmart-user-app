import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "../api/client";
import { getNearbyShops, resolveImageUrl, Shop } from "../api/shops";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";

export function AllStoresScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;
        const data = await getNearbyShops(token);
        setShops(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load stores.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingTop: insets.top + scale(16) }}>
          <View style={[styles.headerRow, { paddingHorizontal: scale(20), marginBottom: scale(16) }]}>
            <Pressable onPress={() => router.back()} style={{ marginRight: scale(10) }}>
              <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
            </Pressable>
            <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy }}>
              All Stores
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
            ) : error ? (
              <Text style={{ color: colors.error, fontSize: scale(typography.size.sm) }}>{error}</Text>
            ) : shops.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm) }}>No stores available yet.</Text>
            ) : (
              shops.map((shop) => (
                <Pressable
                  key={shop.id}
                  onPress={() => router.push({ pathname: "/(tabs)/categories" as any, params: { shopId: shop.id } })}
                >
                  <Card style={{ marginBottom: scale(14), padding: 0, overflow: "hidden", borderRadius: scale(16) }}>
                    <View style={styles.row}>
                      <View style={[styles.thumb, { width: scale(72), height: scale(72) }]}>
                        {resolveImageUrl(shop.logoUrl) ? (
                          <Image source={{ uri: resolveImageUrl(shop.logoUrl)! }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                        ) : (
                          <Ionicons name="storefront" size={scale(26)} color={colors.primary} />
                        )}
                      </View>
                      <View style={{ marginLeft: scale(14), flex: 1, paddingRight: scale(10) }}>
                        <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                          {shop.shopName}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(3) }}>
                          {shop.category}
                        </Text>
                        {shop.totalReviews > 0 ? (

                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname: "/shop-ratings/[shopId]",
                                params: {
                                  shopId: String(shop.id),
                                  name: shop.shopName,
                                },
                              } as any)
                            }
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginTop: scale(4),
                            }}
                          >
                            <Ionicons name="star" color="#FFC107" size={scale(13)} />
                            <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.xs), marginLeft: scale(4) }}>
                              {shop.averageRating.toFixed(1)} · {shop.totalReviews} {shop.totalReviews === 1 ? "Review" : "Reviews"}
                            </Text>
                          </Pressable>
                        ) : (
                          <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(4) }}>
                            No reviews yet
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} />
                    </View>
                  </Card>
                </Pressable>
              ))
            )}
          </ScrollView>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  thumb: {
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});