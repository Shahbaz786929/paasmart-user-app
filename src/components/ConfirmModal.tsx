import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { Button } from "./Button";

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({ visible, title, message, confirmLabel = "Confirm", onConfirm, onCancel }: ConfirmModalProps) {
  const { scale } = useResponsive();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.card, { borderRadius: scale(16), padding: scale(20) }]} onPress={(e) => e.stopPropagation()}>
          <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginBottom: scale(10) }}>
            {title}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), marginBottom: scale(20), lineHeight: scale(20) }}>
            {message}
          </Text>

          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1, marginRight: scale(10) }}>
              <Button variant="outline" label="Cancel" onPress={onCancel} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label={confirmLabel} onPress={onConfirm} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
});