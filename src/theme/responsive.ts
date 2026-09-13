import { Dimensions, PixelRatio } from "react-native";

const { width, height } = Dimensions.get("window");

export const BREAKPOINTS = {
  small: 360,
  medium: 400,
  large: 600,
};

// Auth screens (Login/Register/OTP) — just a form, stays narrow.
export const MAX_CONTENT_WIDTH = 460;

// Main app screens (Home, Categories, Orders, Cart, Account) — much wider
// so laptop/tablet screens actually use the space.
export const APP_MAX_CONTENT_WIDTH = 1200;

export type ScreenSize = "small" | "medium" | "large";

export function getScreenSize(): ScreenSize {
  if (width >= BREAKPOINTS.large) return "large";
  if (width >= BREAKPOINTS.medium) return "medium";
  return "small";
}

export const screen = {
  width,
  height,
  size: getScreenSize(),
  isSmall: getScreenSize() === "small",
  isMedium: getScreenSize() === "medium",
  isLarge: getScreenSize() === "large",
};

export function scale(baseSize: number, currentWidth: number = width): number {
  const effectiveWidth = Math.min(currentWidth, MAX_CONTENT_WIDTH);
  const baseWidth = 400;
  const newSize = (effectiveWidth / baseWidth) * baseSize;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export function responsiveValue<T>(values: { small: T; medium: T; large: T }): T {
  return values[screen.size];
}