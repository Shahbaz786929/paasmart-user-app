import { useRef } from "react";
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputKeyPressEventData, View } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
};

export function OtpInput({ length = 6, value, onChange, error }: OtpInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const { scale } = useResponsive();
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleChangeDigit = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    const nextDigits = [...digits];
    nextDigits[index] = cleaned.slice(-1);
    onChange(nextDigits.join(""));

    if (cleaned && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={[styles.row, { marginBottom: scale(20) }]}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref: TextInput | null): void => {
            inputRefs.current[index] = ref;
          }}
          style={[
            styles.box,
            { width: scale(42), height: scale(50), borderRadius: scale(12), fontSize: scale(typography.size.lg) },
            error && styles.boxError,
            digit && styles.boxFilled,
          ]}
          value={digit}
          onChangeText={(text) => handleChangeDigit(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  box: {
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },
  boxFilled: {
    borderColor: colors.primary,
  },
  boxError: {
    borderColor: colors.error,
  },
});