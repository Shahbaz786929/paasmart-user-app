import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";

type SectionHeaderProps = {
  title: string;
  onViewAll?: () => void;
};

export function SectionHeader({ title, onViewAll }: SectionHeaderProps) {
  const { scale } = useResponsive();

  return (
    <View style={[styles.row, { marginBottom: scale(10) }]}>
      <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold }}>
        {title}
      </Text>
      {onViewAll && (
        <Text
          onPress={onViewAll}
          style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.medium }}
        >
          View All
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});