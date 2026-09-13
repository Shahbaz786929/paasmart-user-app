import { StyleSheet, View, ViewStyle } from "react-native";
import { useResponsive } from "../theme/useResponsive";

type ScreenContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function ScreenContainer({ children, style }: ScreenContainerProps) {
  const { contentWidth } = useResponsive();

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, { width: contentWidth }, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent", // was colors.background — that was painting over AuthBackground's image
    alignItems: "center",
  },
  inner: {
    flex: 1,
  },
});