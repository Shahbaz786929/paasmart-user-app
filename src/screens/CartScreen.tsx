import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSafeBack } from "@/hooks/useSafeBack";
import { getAddresses } from "../api/address";
import { CartItem, clearCart, getCart, removeFromCart, updateCartQuantity } from "../api/cart";
import { ApiError } from "../api/client";
import { getProductById } from "../api/products";
import { getDeliveryFeePreview } from "../api/settings";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ConfirmModal } from "../components/ConfirmModal";
import { QuantityStepper } from "../components/QuantityStepper";
import { useCart } from "../context/CartContext";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";
import { getFirstProductImage } from "../utils/productImages";

export function CartScreen() {
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const router = useRouter();
  const goBack = useSafeBack("/(tabs)/home");
  const { refreshCartCount } = useCart();

  const [items, setItems] = useState<CartItem[]>([]);
  const [imagesByProductId, setImagesByProductId] = useState<Record<number, string | null>>({});
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadCart = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const [data, addressList] = await Promise.all([getCart(token), getAddresses(token).catch(() => [])]);
      setItems(data);
      setError(null);

      const defaultAddress = addressList.find((a) => a.defaultAddress) || addressList[0] || null;
      if (defaultAddress) {
        const preview = await getDeliveryFeePreview(token, defaultAddress.id).catch(() => null);
        setDeliveryFee(preview?.deliveryFee || 0);
      } else {
        setDeliveryFee(0);
      }

      // Cart API doesn't return product images — fetch each product's
      // detail in parallel to get its image for display.
      const uniqueProductIds = [...new Set(data.map((item) => item.productId))];
      const details = await Promise.all(
        uniqueProductIds.map((id) => getProductById(token, id).catch(() => null))
      );
      const imageMap: Record<number, string | null> = {};
      details.forEach((product, index) => {
        if (product) imageMap[uniqueProductIds[index]] = getFirstProductImage(product.images);
      });
      setImagesByProductId(imageMap);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load your cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart])
  );

  const handleQuantityChange = async (item: CartItem, nextQuantity: number) => {
    if (nextQuantity < 1) return;
    setUpdatingId(item.cartId);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const updated = await updateCartQuantity(token, item.cartId, nextQuantity);
      setItems((prev) => prev.map((i) => (i.cartId === item.cartId ? updated : i)));
      await refreshCartCount();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update quantity.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (item: CartItem) => {
    setUpdatingId(item.cartId);
    try {
      const token = await getAuthToken();
      if (!token) return;
      await removeFromCart(token, item.cartId);
      setItems((prev) => prev.filter((i) => i.cartId !== item.cartId));
      await refreshCartCount();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove item.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    setShowClearConfirm(false);
    const token = await getAuthToken();
    if (!token) return;
    try {
      await clearCart(token);
      setItems([]);
      await refreshCartCount();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not clear cart.");
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + (items.length > 0 ? deliveryFee : 0);

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingTop: insets.top + scale(20) }}>
          <View style={[styles.headerRow, { paddingHorizontal: scale(20), marginBottom: scale(16) }]}>
            <View style={[styles.headerRow, { paddingHorizontal: scale(20), marginBottom: scale(16) }]}>
              <Pressable onPress={goBack} style={{ marginRight: scale(10) }}>
                <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
              </Pressable>
              <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy, flex: 1 }}>
                My Cart ({items.length})
              </Text>
            </View>
            {items.length > 0 && (
              <Pressable onPress={() => setShowClearConfirm(true)}>
                <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), fontWeight: typography.weight.medium }}>
                  Clear All
                </Text>
              </Pressable>
            )}
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : error ? (
            <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), paddingHorizontal: scale(20) }}>
              {error}
            </Text>
          ) : items.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={scale(64)} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(12) }}>
                Your cart is empty
              </Text>
            </View>
          ) : (
            <>
              <ScrollView
                contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(16) }}
                showsVerticalScrollIndicator={false}
              >
                {items.map((item) => {
                  const imageUrl = imagesByProductId[item.productId];
                  const goToProduct = () => router.push(`/product/${item.productId}` as any);
                  return (
                    <Card key={item.cartId} style={{ marginBottom: scale(12) }}>
                      <View style={styles.itemRow}>
                        <Pressable onPress={goToProduct} hitSlop={4}>
                          <View style={[styles.thumb, { width: scale(64), height: scale(64), borderRadius: scale(10) }]}>
                            {imageUrl ? (
                              <Image
                                source={{ uri: imageUrl }}
                                style={{ width: scale(64), height: scale(64), borderRadius: scale(10) }}
                                resizeMode="cover"
                              />
                            ) : (
                              <Ionicons name="cube-outline" size={scale(24)} color={colors.textMuted} />
                            )}
                          </View>
                        </Pressable>

                        <View style={{ flex: 1, marginLeft: scale(12) }}>
                          <Pressable onPress={goToProduct} hitSlop={4}>
                            <Text numberOfLines={2} style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm) }}>
                              {item.productName}
                            </Text>
                            <Text style={{ color: colors.primary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm), marginTop: scale(4) }}>
                              ₹{item.price}
                            </Text>
                          </Pressable>

                          <View style={[styles.itemFooter, { marginTop: scale(8) }]}>
                            <QuantityStepper
                              quantity={item.quantity}
                              disabled={updatingId === item.cartId}
                              onIncrease={() => handleQuantityChange(item, item.quantity + 1)}
                              onDecrease={() => handleQuantityChange(item, item.quantity - 1)}
                            />
                            <Pressable onPress={() => handleRemove(item)} disabled={updatingId === item.cartId} hitSlop={8}>
                              <Ionicons name="trash-outline" size={scale(18)} color={colors.error} />
                            </Pressable>
                          </View>
                        </View>

                        <Text style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm) }}>
                          ₹{item.totalPrice}
                        </Text>
                      </View>
                    </Card>
                  );
                })}
              </ScrollView>

              <View style={[styles.summaryCard, { paddingHorizontal: scale(20), paddingTop: scale(14), paddingBottom: insets.bottom + scale(14) }]}>
                <View style={styles.summaryRow}>
                  <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm) }}>Subtotal</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm) }}>₹{subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm) }}>Delivery Fee</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm) }}>₹{deliveryFee}</Text>
                </View>
                <View style={[styles.summaryRow, { marginTop: scale(6), marginBottom: scale(14) }]}>
                  <Text style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.md) }}>
                    Total
                  </Text>
                  <Text style={{ color: colors.primary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.md) }}>
                    ₹{total.toFixed(2)}
                  </Text>
                </View>

                <Button label="Proceed to Checkout" onPress={() => require("expo-router").router.push("/checkout")} />
              </View>
            </>
          )}
        </View>
      </AppScreenContainer>

      <ConfirmModal
        visible={showClearConfirm}
        title="Clear Cart"
        message="Remove all items from your cart?"
        confirmLabel="Clear All"
        onConfirm={handleClearCart}
        onCancel={() => setShowClearConfirm(false)}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: "rgba(15,15,15,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
});