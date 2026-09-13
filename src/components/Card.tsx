import { StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../theme/colors";
import { useResponsive } from "../theme/useResponsive";

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Card({ children, style }: CardProps) {
  const { scale } = useResponsive();

  return (
    <View style={[styles.card, { borderRadius: scale(18), padding: scale(16) }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "rgba(15,15,15,0.72)",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
});