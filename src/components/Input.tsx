import { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
};

export function Input({ label, error, rightElement, leftElement, style, ...rest }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { scale } = useResponsive();

  return (
    <View style={{ width: "100%", marginBottom: scale(10) }}>
      {label && (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: scale(typography.size.sm),
            marginBottom: scale(4),
            fontWeight: typography.weight.medium,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputRow,
          { borderRadius: scale(12), paddingHorizontal: scale(14), height: scale(44) },
          isFocused && styles.inputRowFocused,
          error && styles.inputRowError,
        ]}
      >
        {leftElement || null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { fontSize: scale(typography.size.base), outlineStyle: "none" } as any, // 👈 removes browser's default focus ring
            style,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {rightElement}
      </View>

      {error && (
        <Text style={{ color: colors.error, fontSize: scale(typography.size.xs), marginTop: scale(4) }}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  inputRowFocused: {
    borderColor: colors.primary,
  },
  inputRowError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
  },
});