import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createReturnRequest } from "../api/returns";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";
import { RETURN_REASONS } from "../utils/returnStatus";

export function RequestReturnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const { orderItemId, productName } = useLocalSearchParams<{ orderItemId: string; productName?: string }>();

  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError("Please select a reason for the return.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const token = await getAuthToken();
      if (!token || !orderItemId) return;
      await createReturnRequest(token, Number(orderItemId), selectedReason, description || undefined);
      setSubmitted(true);
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit return request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingTop: insets.top + scale(16) }}>
          <View style={[styles.headerRow, { paddingHorizontal: scale(20), marginBottom: scale(16) }]}>
            <Pressable onPress={() => router.back()} style={{ marginRight: scale(10) }}>
              <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
            </Pressable>
            <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy }}>
              Request Return
            </Text>
          </View>

          {submitted ? (
            <View style={styles.centered}>
              <Ionicons name="checkmark-circle" size={scale(56)} color={colors.primary} />
              <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginTop: scale(12) }}>
                Return Requested
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(4) }}>
                The seller will review your request soon
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }} showsVerticalScrollIndicator={false}>
              {productName ? (
                <Card style={{ marginBottom: scale(16) }}>
                  <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs) }}>Returning item</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginTop: scale(4) }}>
                    {productName}
                  </Text>
                </Card>
              ) : null}

              <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginBottom: scale(10) }}>
                Reason for return
              </Text>
              <Card style={{ marginBottom: scale(16) }}>
                {RETURN_REASONS.map((reason, idx) => (
                  <Pressable key={reason} onPress={() => setSelectedReason(reason)}>
                    <View
                      style={[
                        styles.reasonRow,
                        { paddingVertical: scale(10), borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: colors.surfaceBorder },
                      ]}
                    >
                      <Ionicons
                        name={selectedReason === reason ? "radio-button-on" : "radio-button-off"}
                        size={scale(18)}
                        color={selectedReason === reason ? colors.primary : colors.textMuted}
                      />
                      <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), marginLeft: scale(10) }}>
                        {reason}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </Card>

              <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginBottom: scale(10) }}>
                Additional details (optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tell us more about the issue..."
                placeholderTextColor={colors.textMuted}
                multiline
                style={[styles.textArea, { borderRadius: scale(10), padding: scale(12), fontSize: scale(typography.size.sm), marginBottom: scale(16) }]}
              />

              {error ? (
                <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), marginBottom: scale(12) }}>{error}</Text>
              ) : null}

              <Button label="Submit Return Request" onPress={handleSubmit} loading={submitting} />
            </ScrollView>
          )}
        </View>
      </AppScreenContainer>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
  },
});