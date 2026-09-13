import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";

type CheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  label: React.ReactNode;
};

export function Checkbox({ checked, onToggle, label }: CheckboxProps) {
  const { scale } = useResponsive();

  return (
    <Pressable style={[styles.row, { marginBottom: scale(14) }]} onPress={onToggle}>
      <View
        style={[
          styles.box,
          { width: scale(18), height: scale(18), borderRadius: scale(5), marginRight: scale(8) },
          checked && styles.boxChecked,
        ]}
      >
        {checked && (
          <Text style={{ color: colors.white, fontSize: scale(12), fontWeight: typography.weight.bold }}>
            ✓
          </Text>
        )}
      </View>
      <Text style={{ flex: 1, color: colors.textSecondary, fontSize: scale(typography.size.sm) }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  box: {
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});