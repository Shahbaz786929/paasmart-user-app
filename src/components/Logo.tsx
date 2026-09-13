import { Image } from "react-native";

type LogoProps = {
  size?: number;
};

export function Logo({ size = 100 }: LogoProps) {
  return (
    <Image
      source={require("../../assets/PaasMart_Logo_Transparent.png")}
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
}