import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "../api/client";
import {
    AppNotification,
    getMyNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "../api/notifications";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";
import { NOTIFICATION_META } from "../utils/notificationMeta";

export function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { scale } = useResponsive();

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [markingAll, setMarkingAll] = useState(false);

    const load = useCallback(async () => {
        try {
            const token = await getAuthToken();
            if (!token) return;
            const data = await getMyNotifications(token);
            setNotifications(data);
            setError("");
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not load notifications.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const formatDate = (iso: string) => {
        const date = new Date(iso);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) {
            return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
        }
        return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    const handlePress = async (item: AppNotification) => {
        if (!item.isRead) {
            setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
            try {
                const token = await getAuthToken();
                if (token) await markNotificationRead(token, item.id);
            } catch {
                // Non-critical — local state already updated, ignore failure here.
            }
        }

        if ((item.type === "ORDER_UPDATE" || item.type === "RETURN_REQUEST" || item.type === "CHAT_MESSAGE") && item.referenceId) {
            router.push(`/order/${item.referenceId}` as any);
        } else if (item.type === "WALLET") {
            router.push("/wallet" as any);
        } else if (item.type === "WISHLIST" && item.referenceId) {
            router.push(`/product/${item.referenceId}` as any);
        }
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        setMarkingAll(true);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        try {
            const token = await getAuthToken();
            if (token) await markAllNotificationsRead(token);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not mark all as read.");
        } finally {
            setMarkingAll(false);
        }
    };

    return (
        <AppBackground>
            <AppScreenContainer>
                <StatusBar barStyle="light-content" />
                <View style={{ flex: 1, paddingTop: insets.top + scale(16) }}>
                    <View style={[styles.headerRow, { paddingHorizontal: scale(20), marginBottom: scale(16) }]}>
                        <Pressable
                            onPress={() => (router.canGoBack() ? router.back() : router.push("/(tabs)/home" as any))}
                            style={{ marginRight: scale(10) }}
                        >
                            <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
                        </Pressable>
                        <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy, flex: 1 }}>
                            Notifications
                        </Text>
                        {unreadCount > 0 ? (
                            <Pressable onPress={handleMarkAllRead} disabled={markingAll} hitSlop={8}>
                                <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                                    Mark all read
                                </Text>
                            </Pressable>
                        ) : null}
                    </View>

                    {loading ? (
                        <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
                    ) : error ? (
                        <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), paddingHorizontal: scale(20) }}>{error}</Text>
                    ) : notifications.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="notifications-off-outline" size={scale(64)} color={colors.textMuted} />
                            <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(12) }}>
                                You're all caught up — no notifications yet
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }}
                            showsVerticalScrollIndicator={false}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                        >
                            {notifications.map((item) => {
                                const meta = NOTIFICATION_META[item.type];
                                return (
                                    <Pressable key={item.id} onPress={() => handlePress(item)}>
                                        <Card
                                            style={{
                                                marginBottom: scale(10),
                                                backgroundColor: item.isRead ? undefined : "rgba(34,197,94,0.08)",
                                                borderColor: item.isRead ? colors.surfaceBorder : colors.primary,
                                            }}
                                        >
                                            <View style={styles.row}>
                                                <View
                                                    style={[
                                                        styles.iconCircle,
                                                        {
                                                            width: scale(38),
                                                            height: scale(38),
                                                            borderRadius: scale(19),
                                                            backgroundColor: meta.color + "22",
                                                        },
                                                    ]}
                                                >
                                                    <Ionicons name={meta.icon} size={scale(18)} color={meta.color} />
                                                </View>
                                                <View style={{ marginLeft: scale(10), flex: 1 }}>
                                                    <View style={styles.titleRow}>
                                                        <Text
                                                            style={{
                                                                color: colors.textPrimary,
                                                                fontWeight: item.isRead ? typography.weight.medium : typography.weight.bold,
                                                                fontSize: scale(typography.size.sm),
                                                                flex: 1,
                                                            }}
                                                            numberOfLines={1}
                                                        >
                                                            {item.title}
                                                        </Text>
                                                        {!item.isRead ? <View style={[styles.unreadDot, { width: scale(7), height: scale(7), borderRadius: scale(4) }]} /> : null}
                                                    </View>
                                                    <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(3) }} numberOfLines={2}>
                                                        {item.message}
                                                    </Text>
                                                    <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(4) }}>
                                                        {formatDate(item.createdAt)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </Card>
                                    </Pressable>
                                );
                            })}
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
        justifyContent: "center",
        alignItems: "center",
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    iconCircle: {
        justifyContent: "center",
        alignItems: "center",
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    unreadDot: {
        backgroundColor: colors.primary,
        marginLeft: 6,
    },
});