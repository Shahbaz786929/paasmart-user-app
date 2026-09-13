import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { addToCart } from "../api/cart";
import { ApiError } from "../api/client";
import { getWishlist, removeFromWishlist, WishlistItem } from "../api/wishlist";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { useCart } from "../context/CartContext";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";
import { getFirstProductImage } from "../utils/productImages";

function effectivePrice(price: number, discountPercent: number): number {
  return discountPercent > 0 ? Math.round(price * (1 - discountPercent / 100)) : price;
}

export function WishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const { refreshCartCount } = useCart();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const data = await getWishlist(token);
      setItems(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load wishlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRemove = async (item: WishlistItem) => {
    setBusyId(item.id);
    try {
      const token = await getAuthToken();
      if (!token) return;
      await removeFromWishlist(token, item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove item.");
    } finally {
      setBusyId(null);
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    setBusyId(item.id);
    try {
      const token = await getAuthToken();
      if (!token) return;
      await addToCart(token, item.product.id, 1);
      await refreshCartCount();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add to cart.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingTop: insets.top + scale(16) }}>
          <View style={[styles.headerRow, { paddingHorizontal: scale(20), marginBottom: scale(16) }]}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/account"))}
              style={{ marginRight: scale(10) }}
            >
              <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
            </Pressable>
            <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy }}>
              My Wishlist
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : error ? (
            <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), paddingHorizontal: scale(20) }}>{error}</Text>
          ) : items.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={scale(64)} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(12) }}>
                Your wishlist is empty
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }} showsVerticalScrollIndicator={false}>
              {items.map((item) => {
                const imageUrl = getFirstProductImage(item.product.images);
                const goToProduct = () => router.push(`/product/${item.product.id}` as any);
                return (
                  <Card key={item.id} style={{ marginBottom: scale(12), position: "relative" }}>
                    {/* Delete button — hamesha top-right corner, product name ki length se independent */}
                    <Pressable
                      onPress={() => handleRemove(item)}
                      disabled={busyId === item.id}
                      hitSlop={8}
                      style={{ position: "absolute", top: scale(10), right: scale(10), zIndex: 1 }}
                    >
                      <Ionicons name="trash-outline" size={scale(18)} color={colors.error} />
                    </Pressable>

                    <View style={[styles.itemRow, { paddingRight: scale(24) }]}>
                      <Pressable onPress={goToProduct} hitSlop={4}>
                        <View style={[styles.thumb, { width: scale(56), height: scale(56), borderRadius: scale(10) }]}>
                          {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={{ width: scale(56), height: scale(56), borderRadius: scale(10) }} resizeMode="cover" />
                          ) : (
                            <Ionicons name="cube-outline" size={scale(22)} color={colors.textMuted} />
                          )}
                        </View>
                      </Pressable>

                      <Pressable onPress={goToProduct} hitSlop={4} style={{ flex: 1, marginLeft: scale(12) }}>
                        <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs) }}>
                          {item.product.category}
                          {item.product.subCategory ? ` · ${item.product.subCategory}` : ""}
                        </Text>
                        <Text numberOfLines={2} style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm), marginTop: scale(2) }}>
                          {item.product.name}
                        </Text>

                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: scale(4) }}>
                          <Text style={{ color: colors.primary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm) }}>
                            ₹{effectivePrice(item.product.price, item.product.discountPercent)}
                          </Text>
                          {item.product.discountPercent > 0 && (
                            <>
                              <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginLeft: scale(6), textDecorationLine: "line-through" }}>
                                ₹{item.product.price}
                              </Text>
                              <Text style={{ color: colors.error, fontSize: scale(typography.size.xs), marginLeft: scale(6), fontWeight: typography.weight.bold }}>
                                {item.product.discountPercent}% off
                              </Text>
                            </>
                          )}
                        </View>

                        <Text
                          style={{
                            color: item.product.stockQty > 0 ? colors.primary : colors.error,
                            fontSize: scale(typography.size.xs),
                            marginTop: scale(4),
                            fontWeight: typography.weight.medium,
                          }}
                        >
                          {item.product.stockQty > 0 ? `In Stock (${item.product.stockQty} available)` : "Out of Stock"}
                        </Text>
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() => handleAddToCart(item)}
                      disabled={busyId === item.id || item.product.stockQty === 0}
                      style={{
                        marginTop: scale(12),
                        backgroundColor: colors.primary,
                        borderRadius: scale(8),
                        paddingVertical: scale(9),
                        alignItems: "center",
                        opacity: item.product.stockQty === 0 ? 0.5 : 1,
                      }}
                    >
                      <Text style={{ color: colors.white, fontSize: scale(typography.size.xs), fontWeight: typography.weight.bold }}>
                        {item.product.stockQty === 0 ? "Out of Stock" : "Add to Cart"}
                      </Text>
                    </Pressable>
                  </Card>
                );
              })}
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
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  thumb: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});