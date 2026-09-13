import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { colors } from "../theme/colors";

type RatingStarsProps = {
  rating: number; // 0-5, decimals allowed
  size?: number;
};

export function RatingStars({ rating, size = 14 }: RatingStarsProps) {
  const rounded = Math.round(rating);

  return (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rounded ? "star" : "star-outline"}
          size={size}
          color={star <= rounded ? "#F59E0B" : colors.textMuted}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}