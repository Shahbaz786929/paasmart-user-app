import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { colors } from "../theme/colors";

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  size?: number;
};

export function StarRatingInput({ value, onChange, size = 28 }: StarRatingInputProps) {
  return (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} hitSlop={6} style={{ marginRight: 6 }}>
          <Ionicons
            name={star <= value ? "star" : "star-outline"}
            size={size}
            color={star <= value ? "#F59E0B" : colors.textMuted}
          />
        </Pressable>
      ))}
    </View>
  );
}