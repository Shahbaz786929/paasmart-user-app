import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";

type QuantityStepperProps = {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
};

export function QuantityStepper({ quantity, onIncrease, onDecrease, disabled }: QuantityStepperProps) {
  const { scale } = useResponsive();

  return (
    <View style={[styles.row, { borderRadius: scale(8) }]}>
      <Pressable
        onPress={onDecrease}
        disabled={disabled}
        style={[styles.btn, { width: scale(28), height: scale(28) }]}
      >
        <Ionicons name="remove" size={scale(16)} color={colors.primary} />
      </Pressable>
      <Text style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm), marginHorizontal: scale(10) }}>
        {quantity}
      </Text>
      <Pressable
        onPress={onIncrease}
        disabled={disabled}
        style={[styles.btn, { width: scale(28), height: scale(28) }]}
      >
        <Ionicons name="add" size={scale(16)} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  btn: {
    justifyContent: "center",
    alignItems: "center",
  },
});