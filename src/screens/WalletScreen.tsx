import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "../api/client";
import { getWalletBalance, getWalletHistory, WalletTransaction } from "../api/wallet";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";

const TXN_LABELS: Record<WalletTransaction["type"], string> = {
  REFERRAL_BONUS: "Referral Bonus",
  WELCOME_BONUS: "Welcome Bonus",
  ORDER_PAYMENT: "Order Payment",
  REFUND: "Refund",
};

export function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const [bal, txns] = await Promise.all([getWalletBalance(token), getWalletHistory(token)]);
      setBalance(bal);
      setHistory(txns);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load wallet details.");
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
              My Wallet
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }} showsVerticalScrollIndicator={false}>
              <Card style={{ marginBottom: scale(20), backgroundColor: "rgba(34,197,94,0.12)", borderColor: colors.primary, alignItems: "center", paddingVertical: scale(24) }}>
                <Ionicons name="wallet" size={scale(36)} color={colors.primary} />
                <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), marginTop: scale(10) }}>Available Balance</Text>
                <Text style={{ color: colors.primary, fontSize: scale(typography.size.xxl), fontWeight: typography.weight.heavy, marginTop: scale(4) }}>
                  ₹{balance}
                </Text>
              </Card>

              {error ? (
                <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), marginBottom: scale(12) }}>{error}</Text>
              ) : null}

              <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginBottom: scale(10) }}>
                Transaction History
              </Text>

              {history.length === 0 ? (
                <Card>
                  <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm) }}>No transactions yet.</Text>
                </Card>
              ) : (
                history.map((txn) => {
                  const isCredit = txn.amount >= 0;
                  return (
                    <Card key={txn.id} style={{ marginBottom: scale(10) }}>
                      <View style={styles.txnRow}>
                        <View
                          style={[
                            styles.txnIcon,
                            {
                              width: scale(38),
                              height: scale(38),
                              borderRadius: scale(19),
                              backgroundColor: isCredit ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                            },
                          ]}
                        >
                          <Ionicons
                            name={isCredit ? "arrow-down-outline" : "arrow-up-outline"}
                            size={scale(18)}
                            color={isCredit ? colors.primary : colors.error}
                          />
                        </View>
                        <View style={{ marginLeft: scale(10), flex: 1 }}>
                          <Text style={{ color: colors.textPrimary, fontWeight: typography.weight.medium, fontSize: scale(typography.size.sm) }}>
                            {TXN_LABELS[txn.type]}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }} numberOfLines={1}>
                            {txn.description}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }}>
                            {formatDate(txn.createdAt)}
                          </Text>
                        </View>
                        <Text style={{ color: isCredit ? colors.primary : colors.error, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm) }}>
                          {isCredit ? "+" : ""}₹{txn.amount}
                        </Text>
                      </View>
                    </Card>
                  );
                })
              )}
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
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  txnIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
});