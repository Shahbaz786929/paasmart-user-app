import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getNearbyShops, resolveImageUrl, Shop } from "../api/shops";

import { ApiError } from "../api/client";
import { ActiveDeal, getLiveDeals } from "../api/deals";
import { getUnreadNotificationCount } from "../api/notifications";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { SearchBar } from "../components/SearchBar";
import { SectionHeader } from "../components/SectionHeader";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken, getStoredUser } from "../utils/authStorage";
import { getTimeRemaining } from "../utils/dealCountdown";

// Shop.Category enum from the backend — no dedicated categories endpoint
// exists yet, so this mirrors that enum for the browse-by-category row.
const CATEGORIES = [
  { id: "GENERAL", name: "General", icon: "basket" as const },
  { id: "CLOTHING", name: "Clothing", icon: "shirt" as const },
  { id: "FOOD", name: "Food", icon: "fast-food" as const },
  { id: "MULTI", name: "Multi", icon: "apps" as const },
];

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const { width } = useWindowDimensions();

  const [search, setSearch] = useState("");
  const [deals, setDeals] = useState<ActiveDeal[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const loadShops = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      const data = await getNearbyShops(token);
      setShops(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load stores.");
    }
  }, []);

  useEffect(() => {
    getStoredUser().then((user) => {
      if (user?.name) setUserName(user.name);
    });

    loadShops().finally(() => setLoading(false));
    getAuthToken().then((token) => getLiveDeals(token).then(setDeals).catch(() => { }));

    getAuthToken().then((token) => {
      if (!token) return;
      getUnreadNotificationCount(token)
        .then(setUnreadNotifications)
        .catch(() => { });
    });
  }, [loadShops]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShops();
    setRefreshing(false);
  };

  const isWide = width >= 700;
  const storeColumns = width >= 900 ? 3 : width >= 600 ? 2 : 1;
  const storeCardWidth = `${100 / storeColumns - 2}%` as const;

  const iconButtons = (
    <View style={styles.iconRow}>
      <Pressable style={{ marginLeft: scale(16) }} onPress={() => router.push("/download-app" as any)}>
        <Ionicons name="download-outline" size={scale(22)} color={colors.textPrimary} />
      </Pressable>
      <Pressable style={{ marginLeft: scale(16), position: "relative" }} onPress={() => router.push("/notifications" as any)}>
        <Ionicons name="notifications-outline" size={scale(22)} color={colors.textPrimary} />
        {unreadNotifications > 0 ? <View style={[styles.badgeDot, { width: scale(8), height: scale(8), borderRadius: scale(4) }]} /> : null}
      </Pressable>
      <Pressable style={{ marginLeft: scale(16) }} onPress={() => router.push("/(tabs)/cart" as any)}>
        <Ionicons name="cart-outline" size={scale(22)} color={colors.textPrimary} />
      </Pressable>
      <Pressable style={{ marginLeft: scale(16) }} onPress={() => router.push("/(tabs)/account" as any)}>
        <Ionicons name="person-circle-outline" size={scale(22)} color={colors.textPrimary} />
      </Pressable>
    </View>
  );

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: scale(20),
            paddingTop: insets.top + scale(14),
            paddingBottom: scale(24),
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {isWide ? (
            <View style={[styles.wideHeaderRow, { marginBottom: scale(20) }]}>
              <Pressable onPress={() => router.push("/select-address" as any)} style={[styles.wideGreeting, { flexDirection: "row", alignItems: "center" }]}>
                <View>
                  <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs) }}>Deliver to</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.base), fontWeight: typography.weight.bold }}>
                    Home {userName ? `· Hi, ${userName.split(" ")[0]}` : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={scale(14)} color={colors.textMuted} style={{ marginLeft: scale(4) }} />
              </Pressable>
              <View style={styles.wideSearch}>
                <SearchBar value={search} onChangeText={setSearch} onPress={() => router.push("/search" as any)} />
              </View>
              {iconButtons}
            </View>
          ) : (
            <>
              <View style={[styles.headerRow, { marginBottom: scale(16) }]}>
                <Pressable onPress={() => router.push("/select-address" as any)} style={{ flexDirection: "row", alignItems: "center" }}>
                  <View>
                    <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs) }}>Deliver to</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.base), fontWeight: typography.weight.bold }}>
                      Home {userName ? `· Hi, ${userName.split(" ")[0]}` : ""}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={scale(14)} color={colors.textMuted} style={{ marginLeft: scale(4) }} />
                </Pressable>
                <View style={styles.iconRow}>
                  <Pressable onPress={() => router.push("/download-app" as any)} style={{ marginRight: scale(16) }}>
                    <Ionicons name="download-outline" size={scale(22)} color={colors.textPrimary} />
                  </Pressable>
                  <Pressable onPress={() => router.push("/notifications" as any)} style={{ position: "relative" }}>
                    <Ionicons name="notifications-outline" size={scale(24)} color={colors.textPrimary} />
                    {unreadNotifications > 0 ? <View style={[styles.badgeDot, { width: scale(8), height: scale(8), borderRadius: scale(4) }]} /> : null}
                  </Pressable>
                </View>
              </View>
              <View style={{ marginBottom: scale(16) }}>
                <SearchBar value={search} onChangeText={setSearch} onPress={() => router.push("/search" as any)} />
              </View>
            </>
          )}

          {deals.length > 0 ? (
            <>
              <SectionHeader title="⚡ Flash Deals" onViewAll={() => router.push("/deals" as any)} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: scale(20) }}>
                {deals.slice(0, 8).map((deal) => (
                  <Pressable
                    key={deal.flashSaleId}
                    onPress={() => router.push(`/product/${deal.productId}` as any)}
                    style={{ marginRight: scale(12), width: scale(130) }}
                  >
                    <Card style={{ padding: 0, overflow: "hidden" }}>
                      <View style={{ position: "relative" }}>
                        {deal.productImage ? (
                          <Image source={{ uri: deal.productImage }} style={{ width: "100%", height: scale(90) }} resizeMode="cover" />
                        ) : (
                          <View style={{ width: "100%", height: scale(90), backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="cube-outline" size={scale(22)} color={colors.textMuted} />
                          </View>
                        )}
                        <View style={{ position: "absolute", top: scale(6), left: scale(6), backgroundColor: colors.error, borderRadius: scale(5), paddingHorizontal: scale(5), paddingVertical: scale(1) }}>
                          <Text style={{ color: colors.white, fontSize: scale(9), fontWeight: typography.weight.heavy }}>
                            {deal.discountPercent}% OFF
                          </Text>
                        </View>
                      </View>
                      <View style={{ padding: scale(8) }}>
                        <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: scale(typography.size.xs), fontWeight: typography.weight.bold }}>
                          {deal.productName}
                        </Text>
                        <Text style={{ color: colors.primary, fontSize: scale(typography.size.xs), fontWeight: typography.weight.heavy, marginTop: scale(2) }}>
                          ₹{deal.dealPrice}
                        </Text>
                        <Text style={{ color: colors.warning, fontSize: scale(9), marginTop: scale(2) }}>
                          {getTimeRemaining(deal.endsAt)}
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}

          <SectionHeader title="Top Categories" />
          <View style={[styles.categoryRow, { marginBottom: scale(20) }]}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={styles.categoryItem}
                onPress={() => router.push({ pathname: "/(tabs)/categories" as any, params: { category: cat.id } })}
              >
                <View style={[styles.categoryIcon, { width: scale(52), height: scale(52), borderRadius: scale(16) }]}>
                  <Ionicons name={cat.icon} size={scale(22)} color={colors.primary} />
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.xs), marginTop: scale(6) }}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <SectionHeader title="Popular Stores" onViewAll={() => router.push("/all-stores" as any)} />

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(20) }} />
          ) : error ? (
            <Text style={{ color: colors.error, fontSize: scale(typography.size.sm) }}>{error}</Text>
          ) : shops.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm) }}>No stores available yet.</Text>
          ) : (
            <View style={styles.storeGrid}>
              {shops.map((shop) => (
                <Pressable
                  key={shop.id}
                  onPress={() => router.push({ pathname: "/(tabs)/categories" as any, params: { shopId: shop.id } })}
                  style={{ width: storeColumns === 1 ? "100%" : storeCardWidth }}
                >
                  <Card
                    style={{
                      marginBottom: scale(18),
                      padding: 0,
                      overflow: "hidden",
                      borderRadius: scale(18),
                    }}
                  >
                    <Image
                      source={{
                        uri: resolveImageUrl(shop.logoUrl)!,
                      }}
                      style={{
                        width: "100%",
                        height: scale(170),
                      }}
                      resizeMode="cover"
                    />

                    <View
                      style={{
                        padding: scale(14),
                      }}
                    >
                      <Text
                        style={{
                          fontSize: scale(18),
                          fontWeight: "700",
                          color: colors.textPrimary,
                        }}
                      >
                        {shop.shopName}
                      </Text>

                      {/* Rating */}

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: scale(8),
                        }}
                      >
                        <Ionicons name="star" color="#FFC107" size={16} />

                        <Text
                          style={{
                            marginLeft: 5,
                            color: colors.textSecondary,
                            fontWeight: "600",
                          }}
                        >
                          {shop.totalReviews > 0 ? shop.averageRating.toFixed(1) : "New"}
                        </Text>

                        <Pressable
                          disabled={shop.totalReviews === 0}
                          onPress={() =>
                            router.push({
                              pathname: "/shop-ratings/[shopId]",
                              params: { shopId: String(shop.id), name: shop.shopName },
                            } as any)
                          }
                        >
                          <Text
                            style={{
                              marginLeft: 10,
                              color: colors.textMuted,
                              textDecorationLine: shop.totalReviews > 0 ? "underline" : "none",
                            }}
                          >
                            {shop.totalReviews > 0
                              ? `${shop.totalReviews} ${shop.totalReviews === 1 ? "Review" : "Reviews"}`
                              : "No reviews yet"}
                          </Text>
                        </Pressable>
                      </View>

                      {/* Category */}

                      <View
                        style={{
                          alignSelf: "flex-start",
                          marginTop: scale(12),
                          backgroundColor: "#E7F8EC",
                          paddingHorizontal: scale(12),
                          paddingVertical: scale(6),
                          borderRadius: scale(20),
                        }}
                      >
                        <Text
                          style={{
                            color: "#2E7D32",
                            fontWeight: "600",
                          }}
                        >
                          {shop.category}
                        </Text>
                      </View>

                      {/* Delivery */}

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: scale(12),
                        }}
                      >
                        <Ionicons
                          name="bicycle-outline"
                          color="#22C55E"
                          size={18}
                        />

                        <Text
                          style={{
                            marginLeft: 6,
                            color: colors.textSecondary,
                          }}
                        >
                          {shop.estimatedDeliveryMinMinutes} - {shop.estimatedDeliveryMaxMinutes} mins
                        </Text>
                      </View>

                      {/* Button */}

                      <Pressable
                        style={{
                          marginTop: scale(18),
                          backgroundColor: colors.primary,
                          paddingVertical: scale(12),
                          borderRadius: scale(12),
                          alignItems: "center",
                        }}
                        onPress={() =>
                          router.push({
                            pathname: "/(tabs)/categories" as any,
                            params: { shopId: shop.id },
                          })
                        }
                      >
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "700",
                          }}
                        >
                          Explore Store
                        </Text>
                      </Pressable>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </AppScreenContainer>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wideHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  wideGreeting: {
    marginRight: 24,
  },
  wideSearch: {
    flex: 1,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    maxWidth: 480,
  },
  categoryItem: {
    alignItems: "center",
  },
  categoryIcon: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  storeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeIcon: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeDot: {
    position: "absolute",
    top: -1,
    right: -2,
    backgroundColor: colors.error,
    borderWidth: 1,
    borderColor: colors.background,
  },
});