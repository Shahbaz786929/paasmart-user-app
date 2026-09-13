import { LinearGradient } from "expo-linear-gradient";
import { ImageBackground, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../theme/colors";

type AuthBackgroundProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function AuthBackground({ children, style }: AuthBackgroundProps) {
  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("../../assets/background.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.75)", "rgba(0,0,0,0.94)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.content, style]}>{children}</View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: "100%",
    backgroundColor: colors.background,
  },
  bg: {
    flex: 1,
    minHeight: "100%",
    width: "100%",
  },
  content: {
    flex: 1,
  },
});