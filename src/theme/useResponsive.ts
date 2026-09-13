import { useWindowDimensions } from "react-native";
import { MAX_CONTENT_WIDTH, getScreenSize } from "./responsive";

/**
 * Reactive responsive helper. Unlike a static Dimensions.get() call, this
 * hook re-renders automatically whenever the window/viewport resizes —
 * critical for web/laptop where the browser window can be resized live.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);

  const scale = (baseSize: number) => {
    const baseWidth = 400;
    return Math.round((contentWidth / baseWidth) * baseSize);
  };

  return {
    width,
    height,
    contentWidth,
    scale,
    size: getScreenSize(),
  };
}