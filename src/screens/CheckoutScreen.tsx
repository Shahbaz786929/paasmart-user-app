import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address, getAddresses } from "../api/address";
import { CartItem, getCart } from "../api/cart";
import { placeOrder } from "../api/checkout";
import { ApiError } from "../api/client";
import { applyCoupon, CouponApplyResult } from "../api/coupons";
import { getDeliveryFeePreview } from "../api/settings";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ConfirmModal } from "../components/ConfirmModal";
import { useCart } from "../context/CartContext";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";

export function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const { refreshCartCount } = useCart();
  const params = useLocalSearchParams<{ couponCode?: string }>();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplyResult | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const consumedParamRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const [addressList, cart] = await Promise.all([getAddresses(token), getCart(token)]);
      const chosen = addressList.find((a) => a.defaultAddress) || addressList[0] || null;
      setSelectedAddress(chosen);
      setCartItems(cart);

      if (chosen) {
        const preview = await getDeliveryFeePreview(token, chosen.id).catch(() => null);
        setDeliveryFee(preview?.deliveryFee || 0);
      }
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load checkout details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + (cartItems.length > 0 ? deliveryFee : 0);
  const finalTotal = appliedCoupon ? appliedCoupon.finalAmount : total;

  const handleApplyCoupon = useCallback(
    async (codeToApply: string) => {
      const code = codeToApply.trim().toUpperCase();
      if (!code || total <= 0) return;

      setApplyingCoupon(true);
      setCouponError("");
      try {
        const token = await getAuthToken();
        if (!token) return;
        const result = await applyCoupon(token, code, total);
        setAppliedCoupon(result);
        setCouponInput(code);
      } catch (err) {
        setAppliedCoupon(null);
        setCouponError(err instanceof ApiError ? err.message : "Could not apply this coupon.");
      } finally {
        setApplyingCoupon(false);
      }
    },
    [total]
  );

  // "Coupons & Offers" screen se "Apply" kar ke wapas aane par auto-apply karo
  useEffect(() => {
    if (!loading && params.couponCode && params.couponCode !== consumedParamRef.current && total > 0) {
      consumedParamRef.current = params.couponCode;
      handleApplyCoupon(params.couponCode);
    }
  }, [loading, params.couponCode, total, handleApplyCoupon]);

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const doPlaceOrder = async () => {
    if (!selectedAddress) return;

    setPlacing(true);
    setError("");
    try {
      const token = await getAuthToken();
      if (!token) return;

      const result = await placeOrder(token, {
        addressId: selectedAddress.id,
        paymentMethod,
        couponCode: appliedCoupon?.code,
      });

      await refreshCartCount();
      router.replace({ pathname: "/order-confirmed" as any, params: { orderId: result.orderId, total: result.totalAmount } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not place order.");
    } finally {
      setPlacing(false);
    }
  };

  const handlePlaceOrderPress = () => {
    if (!selectedAddress) {
      setError("Please select a delivery address.");
      return;
    }
    setShowConfirm(true);
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
            <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy }}>
              Checkout
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : (
            <>
              <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(16) }} showsVerticalScrollIndicator={false}>
                {/* Compact selected-address summary */}
                <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginBottom: scale(10) }}>
                  Deliver To
                </Text>

                {selectedAddress ? (
                  <Pressable onPress={() => router.push("/select-address" as any)}>
                    <Card style={{ marginBottom: scale(20) }}>
                      <View style={styles.addressRow}>
                        <Ionicons name="location-outline" size={scale(20)} color={colors.primary} />
                        <View style={{ marginLeft: scale(10), flex: 1 }}>
                          <Text style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm) }}>
                            {selectedAddress.fullName}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }}>
                            {selectedAddress.houseNo}, {selectedAddress.area}
                            {selectedAddress.landmark ? `, ${selectedAddress.landmark}` : ""}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }}>
                            📞 {selectedAddress.mobileNumber}
                          </Text>
                        </View>
                        <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                          Change
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => router.push("/select-address" as any)}>
                    <Card style={{ marginBottom: scale(20), alignItems: "center" }}>
                      <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                        + Select or Add a Delivery Address
                      </Text>
                    </Card>
                  </Pressable>
                )}

                {/* Payment method section */}
                <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginBottom: scale(10) }}>
                  Payment Method
                </Text>
                <View style={{ flexDirection: "row", marginBottom: scale(20) }}>
                  {(["COD", "ONLINE"] as const).map((method) => {
                    const isSelected = paymentMethod === method;
                    return (
                      <Pressable key={method} onPress={() => setPaymentMethod(method)} style={{ flex: 1, marginRight: method === "COD" ? scale(10) : 0 }}>
                        <Card
                          style={{
                            alignItems: "center",
                            paddingVertical: scale(14),
                            borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                            borderWidth: isSelected ? 2 : 1,
                          }}
                        >
                          <Ionicons
                            name={method === "COD" ? "cash-outline" : "card-outline"}
                            size={scale(22)}
                            color={isSelected ? colors.primary : colors.textMuted}
                          />
                          <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), marginTop: scale(6) }}>
                            {method === "COD" ? "Cash on Delivery" : "Pay Online"}
                          </Text>
                        </Card>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Coupon section */}
                <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginBottom: scale(10) }}>
                  Coupons & Offers
                </Text>
                <Card style={{ marginBottom: scale(20) }}>
                  {appliedCoupon ? (
                    <View style={styles.appliedRow}>
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                        <Ionicons name="checkmark-circle" size={scale(18)} color={colors.primary} />
                        <View style={{ marginLeft: scale(8) }}>
                          <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                            {appliedCoupon.code} applied
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }}>
                            You saved ₹{appliedCoupon.discountAmount.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                      <Pressable onPress={handleRemoveCoupon} hitSlop={6}>
                        <Text style={{ color: colors.error, fontSize: scale(typography.size.xs), fontWeight: typography.weight.bold }}>
                          Remove
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <View style={styles.couponInputRow}>
                        <TextInput
                          value={couponInput}
                          onChangeText={(v) => {
                            setCouponInput(v);
                            setCouponError("");
                          }}
                          placeholder="Enter coupon code"
                          placeholderTextColor={colors.textMuted}
                          autoCapitalize="characters"
                          style={[styles.couponInput, { borderRadius: scale(10), paddingHorizontal: scale(12), fontSize: scale(typography.size.sm) }]}
                        />
                        <Pressable
                          onPress={() => handleApplyCoupon(couponInput)}
                          disabled={!couponInput.trim() || applyingCoupon}
                          style={{ marginLeft: scale(8) }}
                        >
                          <View
                            style={[
                              styles.applyBtn,
                              { borderRadius: scale(10), paddingHorizontal: scale(16), opacity: !couponInput.trim() || applyingCoupon ? 0.5 : 1 },
                            ]}
                          >
                            {applyingCoupon ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                                Apply
                              </Text>
                            )}
                          </View>
                        </Pressable>
                      </View>

                      {couponError ? (
                        <Text style={{ color: colors.error, fontSize: scale(typography.size.xs), marginTop: scale(8) }}>{couponError}</Text>
                      ) : null}

                      <Pressable
                        onPress={() => router.push({ pathname: "/coupons" as any, params: { from: "checkout" } })}
                        style={{ flexDirection: "row", alignItems: "center", marginTop: scale(12) }}
                      >
                        <Ionicons name="pricetag-outline" size={scale(15)} color={colors.primary} />
                        <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginLeft: scale(6), flex: 1 }}>
                          View all offers
                        </Text>
                        <Ionicons name="chevron-forward" size={scale(15)} color={colors.primary} />
                      </Pressable>
                    </>
                  )}
                </Card>

                {/* Order summary */}
                <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginBottom: scale(10) }}>
                  Order Summary
                </Text>
                <Card>
                  {cartItems.map((item) => (
                    <View key={item.cartId} style={[styles.summaryRow, { marginBottom: scale(6) }]}>
                      <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), flex: 1 }} numberOfLines={1}>
                        {item.productName} × {item.quantity}
                      </Text>
                      <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm) }}>₹{item.totalPrice}</Text>
                    </View>
                  ))}
                  <View style={[styles.summaryRow, { marginTop: scale(8) }]}>
                    <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm) }}>Subtotal</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm) }}>₹{subtotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm) }}>Delivery Fee</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm) }}>₹{deliveryFee}</Text>
                  </View>
                  {appliedCoupon ? (
                    <View style={styles.summaryRow}>
                      <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm) }}>Coupon Discount ({appliedCoupon.code})</Text>
                      <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm) }}>−₹{appliedCoupon.discountAmount.toFixed(2)}</Text>
                    </View>
                  ) : null}
                  <View style={[styles.summaryRow, { marginTop: scale(6) }]}>
                    <Text style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.md) }}>Total</Text>
                    <Text style={{ color: colors.primary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.md) }}>₹{finalTotal.toFixed(2)}</Text>
                  </View>
                </Card>

                {error ? (
                  <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), marginTop: scale(12) }}>{error}</Text>
                ) : null}
              </ScrollView>

              <View style={[styles.footer, { paddingHorizontal: scale(20), paddingTop: scale(12), paddingBottom: insets.bottom + scale(12) }]}>
                <Button label="Place Order" onPress={handlePlaceOrderPress} loading={placing} disabled={cartItems.length === 0} />
              </View>
            </>
          )}
        </View>
      </AppScreenContainer>

      <ConfirmModal
        visible={showConfirm}
        title="Confirm Order"
        message={
          selectedAddress
            ? `Deliver to ${selectedAddress.fullName}\n${selectedAddress.houseNo}, ${selectedAddress.area}, ${selectedAddress.city}?`
            : ""
        }
        confirmLabel="Place Order"
        onConfirm={() => {
          setShowConfirm(false);
          doPlaceOrder();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  couponInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  couponInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    color: colors.textPrimary,
  },
  applyBtn: {
    height: 44,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  appliedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footer: {
    backgroundColor: "rgba(15,15,15,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
});