import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";

type ButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline";
  rightIcon?: React.ReactNode;
};

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  rightIcon,
}: ButtonProps) {
  const { scale } = useResponsive();
  const isOutline = variant === "outline";

  const dynamicStyles = {
    height: scale(50),
    borderRadius: scale(14),
  };

  if (isOutline) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.outlineButton, dynamicStyles, disabled && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[styles.outlineText, { fontSize: scale(typography.size.base) }]}>
            {label}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={[styles.wrapper, dynamicStyles]}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, dynamicStyles, disabled && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <View style={styles.content}>
            <Text style={[styles.text, { fontSize: scale(typography.size.base) }]}>{label}</Text>
            {rightIcon}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    color: colors.white,
    fontWeight: typography.weight.bold,
  },
  outlineButton: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  outlineText: {
    color: colors.white,
    fontWeight: typography.weight.bold,
  },
  disabled: {
    opacity: 0.5,
  },
});