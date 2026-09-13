import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatMessage, getMessages, sendChatMessage } from "../api/chat";
import { ApiError } from "../api/client";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken, getStoredUser } from "../utils/authStorage";

const POLL_INTERVAL_MS = 4000;

export function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const { orderId, otherPartyName } = useLocalSearchParams<{ orderId: string; otherPartyName?: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef<ScrollView>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const token = await getAuthToken();
        if (!token || !orderId) return;
        const data = await getMessages(token, Number(orderId));
        setMessages(data);
        setError("");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load messages.");
      } finally {
        setLoading(false);
      }
    },
    [orderId]
  );

  useFocusEffect(
    useCallback(() => {
      getStoredUser().then((user) => {
        if (user?.userId) setMyUserId(user.userId);
      });

      load();
      pollRef.current = setInterval(() => load(true), POLL_INTERVAL_MS);

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [load])
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText("");
    try {
      const token = await getAuthToken();
      if (!token || !orderId) return;
      const sent = await sendChatMessage(token, Number(orderId), text);
      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send message.");
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={insets.top}>
          <View style={{ flex: 1, paddingTop: insets.top + scale(16) }}>
            <View style={[styles.headerRow, { paddingHorizontal: scale(20), marginBottom: scale(12) }]}>
              <Pressable onPress={() => router.back()} style={{ marginRight: scale(10) }}>
                <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
              </Pressable>
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.heavy }}>
                  {otherPartyName || "Chat"}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs) }}>Order #{orderId}</Text>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
            ) : (
              <>
                <ScrollView
                  ref={scrollRef}
                  contentContainerStyle={{ paddingHorizontal: scale(16), paddingBottom: scale(12), flexGrow: 1 }}
                  showsVerticalScrollIndicator={false}
                >
                  {messages.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="chatbubbles-outline" size={scale(48)} color={colors.textMuted} />
                      <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(10) }}>
                        Say hello — start the conversation
                      </Text>
                    </View>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === myUserId;
                      return (
                        <View
                          key={msg.id}
                          style={[
                            styles.bubbleRow,
                            { justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: scale(10) },
                          ]}
                        >
                          <View
                            style={[
                              styles.bubble,
                              {
                                borderRadius: scale(14),
                                paddingHorizontal: scale(14),
                                paddingVertical: scale(9),
                                backgroundColor: isMine ? colors.primary : colors.surface,
                                borderWidth: isMine ? 0 : 1,
                                borderColor: colors.surfaceBorder,
                                borderBottomRightRadius: isMine ? scale(2) : scale(14),
                                borderBottomLeftRadius: isMine ? scale(14) : scale(2),
                              },
                            ]}
                          >
                            <Text style={{ color: isMine ? colors.white : colors.textPrimary, fontSize: scale(typography.size.sm) }}>
                              {msg.message}
                            </Text>
                            <Text
                              style={{
                                color: isMine ? "rgba(255,255,255,0.7)" : colors.textMuted,
                                fontSize: scale(10),
                                marginTop: scale(4),
                                textAlign: "right",
                              }}
                            >
                              {formatTime(msg.createdAt)}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                {error ? (
                  <Text style={{ color: colors.error, fontSize: scale(typography.size.xs), paddingHorizontal: scale(20), marginBottom: scale(6) }}>
                    {error}
                  </Text>
                ) : null}

                <View
                  style={[
                    styles.inputRow,
                    { paddingHorizontal: scale(16), paddingBottom: insets.bottom + scale(12), paddingTop: scale(10) },
                  ]}
                >
                  <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    style={[styles.input, { borderRadius: scale(20), paddingHorizontal: scale(14), fontSize: scale(typography.size.sm) }]}
                  />
                  <Pressable onPress={handleSend} disabled={sending || !inputText.trim()} style={{ marginLeft: scale(8) }}>
                    <View
                      style={[
                        styles.sendBtn,
                        { width: scale(40), height: scale(40), borderRadius: scale(20), opacity: sending || !inputText.trim() ? 0.5 : 1 },
                      ]}
                    >
                      <Ionicons name="send" size={scale(16)} color={colors.white} />
                    </View>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
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
    marginTop: 60,
  },
  bubbleRow: {
    flexDirection: "row",
  },
  bubble: {
    maxWidth: "78%",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    color: colors.textPrimary,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});