import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Linking, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";

// TODO: App publish hone ke baad yahan real Play Store / App Store links daal dena.
// Abhi placeholder hain — jab tak real links na aa jayen, buttons disabled rahenge.
const PLAY_STORE_URL = "";
const APP_STORE_URL = "";

export function DownloadAppScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const openLink = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingTop: insets.top + scale(16), paddingHorizontal: scale(20) }}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={{ marginRight: scale(10) }}>
              <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
            </Pressable>
            <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy }}>
              Get the App
            </Text>
          </View>

          <View style={{ alignItems: "center", marginTop: scale(30) }}>
            <View style={[styles.iconCircle, { width: scale(84), height: scale(84), borderRadius: scale(42) }]}>
              <Ionicons name="phone-portrait-outline" size={scale(38)} color={colors.primary} />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginTop: scale(16), textAlign: "center" }}>
              Get a faster experience on the app
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(6), textAlign: "center" }}>
              Order tracking, notifications aur offers — sab kuch mobile app par behtar chalta hai.
            </Text>
          </View>

          <Card style={{ marginTop: scale(28) }}>
            <Pressable
              onPress={() => openLink(PLAY_STORE_URL)}
              disabled={!PLAY_STORE_URL}
              style={[styles.storeRow, { opacity: PLAY_STORE_URL ? 1 : 0.5 }]}
            >
              <Ionicons name="logo-google-playstore" size={scale(26)} color={colors.textPrimary} />
              <View style={{ marginLeft: scale(12), flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                  Google Play
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }}>
                  {PLAY_STORE_URL ? "Download for Android" : "Coming soon"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              onPress={() => openLink(APP_STORE_URL)}
              disabled={!APP_STORE_URL}
              style={[styles.storeRow, { opacity: APP_STORE_URL ? 1 : 0.5 }]}
            >
              <Ionicons name="logo-apple-appstore" size={scale(26)} color={colors.textPrimary} />
              <View style={{ marginLeft: scale(12), flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                  App Store
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }}>
                  {APP_STORE_URL ? "Download for iPhone" : "Coming soon"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} />
            </Pressable>
          </Card>
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
  iconCircle: {
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: 4,
  },
});