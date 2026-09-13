import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onPress?: () => void;
};

export function SearchBar({ value, onChangeText, placeholder = "Search products, stores...", onPress }: SearchBarProps) {
  const { scale } = useResponsive();

  return (
    <View
      style={[
        styles.container,
        { borderRadius: scale(14), paddingHorizontal: scale(14), height: scale(46) },
      ]}
    >
      <Ionicons name="search" size={scale(18)} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onFocus={onPress}
        style={[styles.input, { fontSize: scale(typography.size.sm), marginLeft: scale(8) }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
  },
});