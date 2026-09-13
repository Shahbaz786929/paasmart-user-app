import { useRouter } from "expo-router";

export function useSafeBack(fallback: string = "/(tabs)/home") {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as any);
    }
  };
}