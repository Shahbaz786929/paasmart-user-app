import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "../api/client";
import { getMyProfile, Profile } from "../api/profile";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";

export function ReferEarnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      const data = await getMyProfile(token);
      setProfile(data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load referral details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCopy = async () => {
    if (!profile?.referralCode) return;
    if (Platform.OS === "web" && navigator?.clipboard) {
      await navigator.clipboard.writeText(profile.referralCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
              Refer & Earn
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }} showsVerticalScrollIndicator={false}>
              <Card style={{ alignItems: "center", paddingVertical: scale(24), marginBottom: scale(20) }}>
                <Ionicons name="gift" size={scale(40)} color={colors.primary} />
                <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginTop: scale(12), textAlign: "center" }}>
                  Invite friends & earn rewards
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), marginTop: scale(6), textAlign: "center" }}>
                  You and your friend both get bonus wallet credit when they place their first order.
                </Text>
              </Card>

              {error ? (
                <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), marginBottom: scale(12) }}>{error}</Text>
              ) : null}

              <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), marginBottom: scale(8) }}>
                Your Referral Code
              </Text>
              <Card style={{ marginBottom: scale(20) }}>
                <View style={styles.codeRow}>
                  <Text style={{ color: colors.primary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy, letterSpacing: 2 }}>
                    {profile?.referralCode || "—"}
                  </Text>
                  <Pressable onPress={handleCopy} style={styles.copyBtn}>
                    <Ionicons name={copied ? "checkmark" : "copy-outline"} size={scale(18)} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontSize: scale(typography.size.xs), marginLeft: scale(4), fontWeight: typography.weight.bold }}>
                      {copied ? "Copied" : "Copy"}
                    </Text>
                  </Pressable>
                </View>
              </Card>

              <Card>
                <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginBottom: scale(8) }}>
                  How it works
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), lineHeight: scale(20) }}>
                  1. Share your referral code with friends{"\n"}
                  2. They enter it when registering on PaasMart{"\n"}
                  3. Once they place their first order, you both get wallet credit
                </Text>
              </Card>
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
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
});