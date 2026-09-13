import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConversationSummary, getMyConversations } from "../api/chat";
import { ApiError } from "../api/client";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";

export function ConversationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const data = await getMyConversations(token);
      setConversations(data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load chats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    const date = new Date(iso);
    const isToday = date.toDateString() === new Date().toDateString();
    return isToday
      ? date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
      : date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
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
              My Chats
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : error ? (
            <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), paddingHorizontal: scale(20) }}>{error}</Text>
          ) : conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={scale(56)} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(12) }}>
                No conversations yet
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(4), textAlign: "center" }}>
                Chat with a seller from your order details page
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }} showsVerticalScrollIndicator={false}>
              {conversations.map((conv) => (
                <Pressable
                  key={conv.conversationId}
                  onPress={() =>
                    router.push({
                      pathname: `/chat/${conv.orderId}` as any,
                      params: { otherPartyName: conv.otherPartyName },
                    })
                  }
                >
                  <Card style={{ marginBottom: scale(10) }}>
                    <View style={styles.row}>
                      <View style={[styles.avatar, { width: scale(42), height: scale(42), borderRadius: scale(21) }]}>
                        <Ionicons name="storefront" size={scale(18)} color={colors.primary} />
                      </View>
                      <View style={{ marginLeft: scale(10), flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontSize: scale(typography.size.sm),
                              fontWeight: conv.unreadCount > 0 ? typography.weight.bold : typography.weight.medium,
                              flex: 1,
                            }}
                            numberOfLines={1}
                          >
                            {conv.otherPartyName}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: scale(10) }}>{formatTime(conv.lastMessageAt)}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: scale(3) }}>
                          <Text
                            style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), flex: 1 }}
                            numberOfLines={1}
                          >
                            {conv.lastMessage || "Order #" + conv.orderId}
                          </Text>
                          {conv.unreadCount > 0 ? (
                            <View style={[styles.unreadBadge, { minWidth: scale(18), height: scale(18), borderRadius: scale(9) }]}>
                              <Text style={{ color: colors.white, fontSize: scale(10), fontWeight: typography.weight.bold }}>
                                {conv.unreadCount}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
});