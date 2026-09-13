import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "../api/client";
import { getMyReturnRequests, ReturnRequest } from "../api/returns";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";
import { getReturnStatusColor, RETURN_STATUS_LABELS } from "../utils/returnStatus";

export function MyReturnsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const data = await getMyReturnRequests(token);
      setReturns(data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load your returns.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

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
              My Returns
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : error ? (
            <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), paddingHorizontal: scale(20) }}>{error}</Text>
          ) : returns.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="return-up-back-outline" size={scale(56)} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(12) }}>
                No return requests yet
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }} showsVerticalScrollIndicator={false}>
              {returns.map((ret) => (
                <Pressable key={ret.id} onPress={() => router.push(`/order/${ret.orderId}` as any)}>
                  <Card style={{ marginBottom: scale(12) }}>
                    <View style={styles.topRow}>
                      <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs) }}>
                        Order #{ret.orderId} · {formatDate(ret.createdAt)}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getReturnStatusColor(ret.status) + "22", borderColor: getReturnStatusColor(ret.status), paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(6) },
                        ]}
                      >
                        <Text style={{ color: getReturnStatusColor(ret.status), fontSize: scale(typography.size.xs), fontWeight: typography.weight.bold }}>
                          {RETURN_STATUS_LABELS[ret.status]}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.medium, marginTop: scale(8) }}>
                      {ret.reason}
                    </Text>
                    {ret.description ? (
                      <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.xs), marginTop: scale(4) }} numberOfLines={2}>
                        {ret.description}
                      </Text>
                    ) : null}
                    {ret.status === "REJECTED" && ret.rejectionReason ? (
                      <Text style={{ color: colors.error, fontSize: scale(typography.size.xs), marginTop: scale(6) }}>
                        Reason: {ret.rejectionReason}
                      </Text>
                    ) : null}
                    {ret.status === "REFUNDED" && ret.refundAmount ? (
                      <Text style={{ color: colors.primary, fontSize: scale(typography.size.xs), marginTop: scale(6), fontWeight: typography.weight.bold }}>
                        ₹{ret.refundAmount} refunded to wallet
                      </Text>
                    ) : null}
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
    alignItems: "center",
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    borderWidth: 1,
  },
});