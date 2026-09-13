import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { OrderStatus, OrderStatusHistoryEntry } from "../api/orders";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { formatDateTime, getActiveStageIndex, ORDER_STAGES } from "../utils/orderStatus";

type RowState = "done" | "current" | "pending" | "cancelled";

type OrderTimelineTrackerProps = {
  status: OrderStatus;
  history: OrderStatusHistoryEntry[];
};

export function OrderTimelineTracker({ status, history }: OrderTimelineTrackerProps) {
  const { scale } = useResponsive();

  if (status === "CANCELLED") {
    const cancelledEntry = history.find((h) => h.status === "CANCELLED");
    const priorEntries = history.filter((h) => h.status !== "CANCELLED");

    return (
      <View>
        {priorEntries.map((entry) => (
          <TimelineRow
            key={entry.id}
            icon="checkmark-circle-outline"
            label={ORDER_STAGES.find((s) => s.status === entry.status)?.label || entry.status}
            timestamp={formatDateTime(entry.createdAt)}
            state="done"
            isLast={false}
            scale={scale}
          />
        ))}
        <TimelineRow
          icon="close-circle-outline"
          label="Order Cancelled"
          timestamp={cancelledEntry ? formatDateTime(cancelledEntry.createdAt) : undefined}
          state="cancelled"
          isLast
          scale={scale}
        />
      </View>
    );
  }

  const activeIndex = getActiveStageIndex(status);

  return (
    <View>
      {ORDER_STAGES.map((stage, index) => {
        const entry = history.find((h) => h.status === stage.status);
        const state: RowState = index < activeIndex ? "done" : index === activeIndex ? "current" : "pending";

        return (
          <TimelineRow
            key={stage.status}
            icon={stage.icon}
            label={stage.label}
            timestamp={entry ? formatDateTime(entry.createdAt) : undefined}
            state={state}
            isLast={index === ORDER_STAGES.length - 1}
            scale={scale}
          />
        );
      })}
    </View>
  );
}

type TimelineRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  timestamp?: string;
  state: RowState;
  isLast: boolean;
  scale: (n: number) => number;
};

function TimelineRow({ icon, label, timestamp, state, isLast, scale }: TimelineRowProps) {
  let circleBg = "transparent";
  let circleBorder = colors.surfaceBorder;
  let borderWidth = 1.5;
  let iconColor = colors.textMuted;

  if (state === "done") {
    circleBg = colors.primary;
    circleBorder = colors.primary;
    borderWidth = 0;
    iconColor = colors.white;
  } else if (state === "current") {
    circleBg = colors.primaryLight;
    circleBorder = colors.primary;
    borderWidth = 2;
    iconColor = colors.primary;
  } else if (state === "cancelled") {
    circleBg = colors.error;
    circleBorder = colors.error;
    borderWidth = 0;
    iconColor = colors.white;
  }

  const lineColor = state === "done" ? colors.primary : colors.surfaceBorder;
  const labelColor = state === "pending" ? colors.textMuted : colors.textPrimary;

  return (
    <View style={styles.row}>
      <View style={{ alignItems: "center", width: scale(30) }}>
        <View
          style={[
            styles.circle,
            {
              width: scale(28),
              height: scale(28),
              borderRadius: scale(14),
              backgroundColor: circleBg,
              borderColor: circleBorder,
              borderWidth,
            },
          ]}
        >
          <Ionicons name={icon} size={scale(14)} color={iconColor} />
        </View>
        {!isLast && (
          <View
            style={{
              width: 2,
              flex: 1,
              minHeight: scale(22),
              backgroundColor: lineColor,
              marginVertical: scale(2),
            }}
          />
        )}
      </View>
      <View style={{ marginLeft: scale(12), flex: 1, paddingBottom: isLast ? 0 : scale(16) }}>
        <Text
          style={{
            color: labelColor,
            fontSize: scale(typography.size.sm),
            fontWeight: state === "current" ? typography.weight.bold : typography.weight.medium,
          }}
        >
          {label}
          {state === "current" ? "  ·  In progress" : ""}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }}>
          {timestamp || "Pending"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  circle: {
    justifyContent: "center",
    alignItems: "center",
  },
});