import { StyleSheet, View, ViewStyle, useWindowDimensions } from "react-native";
import { APP_MAX_CONTENT_WIDTH } from "../theme/responsive";

type AppScreenContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function AppScreenContainer({ children, style }: AppScreenContainerProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, APP_MAX_CONTENT_WIDTH);

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
    backgroundColor: "transparent",
    alignItems: "center",
  },
  inner: {
    flex: 1,
  },
});