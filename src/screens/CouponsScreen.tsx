import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "../api/client";
import { Coupon, getActiveCoupons } from "../api/coupons";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";
import { getDiscountLabel, getExpiryLabel, getMinOrderLabel } from "../utils/couponHelpers";

export function CouponsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isCheckoutMode = from === "checkout";

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const data = await getActiveCoupons(token);
      setCoupons(data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load offers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleApply = (code: string) => {
    router.replace({ pathname: "/checkout" as any, params: { couponCode: code } });
  };

  const handleCopy = async (code: string) => {
    if (Platform.OS === "web" && navigator?.clipboard) {
      await navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
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
              Coupons & Offers
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : error ? (
            <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), paddingHorizontal: scale(20) }}>{error}</Text>
          ) : coupons.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={scale(56)} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(12) }}>
                No offers available right now
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }} showsVerticalScrollIndicator={false}>
              {coupons.map((coupon) => {
                const minOrderLabel = getMinOrderLabel(coupon);
                const expiryLabel = getExpiryLabel(coupon);
                const isCopied = copiedCode === coupon.code;

                return (
                  <Card key={coupon.id} style={{ marginBottom: scale(12) }}>
                    <View style={styles.row}>
                      <View
                        style={[
                          styles.iconCircle,
                          { width: scale(40), height: scale(40), borderRadius: scale(10) },
                        ]}
                      >
                        <Ionicons name="pricetag" size={scale(18)} color={colors.primary} />
                      </View>
                      <View style={{ marginLeft: scale(12), flex: 1 }}>
                        <Text style={{ color: colors.primary, fontSize: scale(typography.size.md), fontWeight: typography.weight.heavy, letterSpacing: 1 }}>
                          {coupon.code}
                        </Text>
                        <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginTop: scale(2) }}>
                          {getDiscountLabel(coupon)}
                        </Text>
                        {coupon.description ? (
                          <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.xs), marginTop: scale(4) }}>
                            {coupon.description}
                          </Text>
                        ) : null}
                        {minOrderLabel ? (
                          <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(4) }}>
                            {minOrderLabel}
                          </Text>
                        ) : null}
                        {expiryLabel ? (
                          <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }}>
                            {expiryLabel}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={{ marginTop: scale(12) }}>
                      {isCheckoutMode ? (
                        <Pressable onPress={() => handleApply(coupon.code)}>
                          <View style={[styles.applyBtn, { borderRadius: scale(8), paddingVertical: scale(8) }]}>
                            <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                              Apply Coupon
                            </Text>
                          </View>
                        </Pressable>
                      ) : (
                        <Pressable onPress={() => handleCopy(coupon.code)}>
                          <View style={[styles.applyBtn, { borderRadius: scale(8), paddingVertical: scale(8) }]}>
                            <Ionicons name={isCopied ? "checkmark" : "copy-outline"} size={scale(14)} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginLeft: scale(6) }}>
                              {isCopied ? "Copied" : "Copy Code"}
                            </Text>
                          </View>
                        </Pressable>
                      )}
                    </View>
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
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconCircle: {
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  applyBtn: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});