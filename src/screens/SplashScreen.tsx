import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";

import { AuthBackground } from "../components/AuthBackground";
import { Logo } from "../components/Logo";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";

export function SplashScreen() {
  const router = useRouter();
  const { scale } = useResponsive();

  useEffect(() => {
    StatusBar.setBarStyle("light-content");

    const timer = setTimeout(() => {
      router.replace("/(auth)/login" as any);
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <AuthBackground>
      <ScreenContainer>
        <View style={styles.center}>
          <Logo size={scale(96)} />
          <Text style={[styles.title, { fontSize: scale(typography.size.xl), marginTop: scale(18) }]}>
            PaasMart
          </Text>
          <Text style={[styles.subtitle, { fontSize: scale(typography.size.base), marginTop: scale(6) }]}>
            Hyperlocal Delivery
          </Text>
          <Text style={[styles.tagline, { fontSize: scale(typography.size.sm), marginTop: scale(20) }]}>
            Shop from trusted local sellers near you.
          </Text>
        </View>
      </ScreenContainer>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: typography.weight.heavy,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.primary,
    fontWeight: typography.weight.medium,
  },
  tagline: {
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});