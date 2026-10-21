import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { logoutRequest } from "../api/auth";
import { ApiError } from "../api/client";
import { getMyProfile, Profile } from "../api/profile";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { ConfirmModal } from "../components/ConfirmModal";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { clearAuthSession, getAuthToken } from "../utils/authStorage";

const MENU_ITEMS = [
  { icon: "receipt-outline" as const, label: "My Orders", route: "/(tabs)/orders" },
  { icon: "return-up-back-outline" as const, label: "My Returns", route: "/returns" },
  { icon: "location-outline" as const, label: "My Addresses", route: "/select-address" },
  { icon: "heart-outline" as const, label: "Wishlist", route: "/wishlist" },
  { icon: "pricetag-outline" as const, label: "Coupons & Offers", route: "/coupons" },
  { icon: "flash-outline" as const, label: "Flash Deals", route: "/deals" },
  { icon: "wallet-outline" as const, label: "Wallet", route: "/wallet" },
  { icon: "gift-outline" as const, label: "Refer & Earn", route: "/refer-earn" },
  { icon: "notifications-outline" as const, label: "Notifications", route: "/notifications" },
  { icon: "chatbubbles-outline" as const, label: "My Chats", route: "/chats" },
];

export function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      const data = await getMyProfile(token);
      setProfile(data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    const token = await getAuthToken();
    // Backend par logout request bhejo
    if (token) {
      await logoutRequest(token).catch(() => { });
    }
    await clearAuthSession();
    router.replace("/(auth)/login" as any);
  };

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: insets.top + scale(20),
            paddingHorizontal: scale(20),
            paddingBottom: scale(40) + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : (
            <>
              <View style={[styles.profileRow, { marginBottom: scale(20) }]}>
                <View style={[styles.avatar, { width: scale(56), height: scale(56), borderRadius: scale(28), overflow: "hidden" }]}>
                  {profile?.profileImage ? (
                    <Image source={{ uri: profile.profileImage }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="person" size={scale(28)} color={colors.primary} />
                  )}
                </View>
                <View style={{ marginLeft: scale(12), flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold }}>
                    {profile?.name || "Guest"}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs) }}>
                    📞 {profile?.phone || ""}
                  </Text>
                </View>
                <Pressable onPress={() => router.push("/edit-profile" as any)} hitSlop={8}>
                  <Ionicons name="create-outline" size={scale(22)} color={colors.textSecondary} />
                </Pressable>
              </View>

              {error ? (
                <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), marginBottom: scale(12) }}>{error}</Text>
              ) : null}

              {/* Wallet balance summary card */}
              <Card style={{ marginBottom: scale(20), backgroundColor: "rgba(34,197,94,0.12)", borderColor: colors.primary }}>
                <View style={styles.walletRow}>
                  <View>
                    <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.xs) }}>Wallet Balance</Text>
                    <Text style={{ color: colors.primary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy, marginTop: scale(2) }}>
                      ₹{profile?.walletBalance ?? 0}
                    </Text>
                  </View>
                  <Ionicons name="wallet" size={scale(32)} color={colors.primary} />
                </View>
              </Card>

              <Card style={{ padding: 0 }}>
                {MENU_ITEMS.map((item, index) => (
                  <Pressable
                    key={item.label}
                    onPress={() => router.push(item.route as any)}
                    style={[
                      styles.menuRow,
                      {
                        paddingVertical: scale(14),
                        paddingHorizontal: scale(16),
                        borderBottomWidth: index === MENU_ITEMS.length - 1 ? 0 : 1,
                        borderBottomColor: colors.surfaceBorder,
                      },
                    ]}
                  >
                    <Ionicons name={item.icon} size={scale(20)} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), marginLeft: scale(12), flex: 1 }}>
                      {item.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={scale(16)} color={colors.textMuted} />
                  </Pressable>
                ))}
              </Card>

              <Pressable onPress={() => setShowLogoutConfirm(true)} style={{ marginTop: scale(20), alignItems: "center" }}>
                <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                  Logout
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </AppScreenContainer>

      <ConfirmModal
        visible={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  walletRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});