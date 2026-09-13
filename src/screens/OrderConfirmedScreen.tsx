import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Button } from "../components/Button";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";

export function OrderConfirmedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const { orderId, total } = useLocalSearchParams<{ orderId: string; total: string }>();

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <View style={[styles.center, { paddingTop: insets.top, paddingHorizontal: scale(24) }]}>
          <View style={[styles.iconCircle, { width: scale(80), height: scale(80), borderRadius: scale(40) }]}>
            <Ionicons name="checkmark" size={scale(40)} color={colors.white} />
          </View>

          <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.xl), fontWeight: typography.weight.heavy, marginTop: scale(20) }}>
            Order Placed!
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), marginTop: scale(8), textAlign: "center" }}>
            Order #{orderId} has been placed successfully.{"\n"}Total: ₹{total}
          </Text>

          <View style={{ marginTop: scale(30), width: "100%" }}>
            <Button label="View My Orders" onPress={() => router.replace("/(tabs)/orders" as any)} />
          </View>
        </View>
      </AppScreenContainer>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});