import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError } from "../api/client";
import { cancelOrder, getOrderDetail, getOrderTimeline, Order, OrderItem, OrderStatusHistoryEntry } from "../api/orders";
import { getReturnRequestsForOrder, ReturnRequest } from "../api/returns";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ConfirmModal } from "../components/ConfirmModal";
import { OrderTimelineTracker } from "../components/OrderTimelineTracker";
import { useCart } from "../context/CartContext";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";
import { downloadInvoice } from "../utils/invoiceDownload";
import { canCancelOrder, getStatusColor, isActiveOrder, ORDER_STATUS_LABELS } from "../utils/orderStatus";
import { reorderItems } from "../utils/reorder";
import { canRequestReturn } from "../utils/returnStatus";

function SummaryRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  const { scale } = useResponsive();
  return (
    <View style={[styles.itemRow, { marginTop: scale(6) }]}>
      <Text
        style={{
          color: bold ? colors.textPrimary : colors.textSecondary,
          fontWeight: bold ? typography.weight.bold : undefined,
          fontSize: scale(bold ? typography.size.md : typography.size.sm),
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: accent ? colors.primary : colors.textPrimary,
          fontWeight: bold ? typography.weight.bold : undefined,
          fontSize: scale(bold ? typography.size.md : typography.size.sm),
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function OrderDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const { refreshCartCount } = useCart();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [timeline, setTimeline] = useState<OrderStatusHistoryEntry[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloadingInvoice(true);
    setInvoiceError("");
    try {
      await downloadInvoice(order.id);
    } catch (err) {
      setInvoiceError(err instanceof Error ? err.message : "Could not download invoice.");
    } finally {
      setDownloadingInvoice(false);
    }
  };
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token || !id) return;

      const [detail, history, returns] = await Promise.all([
        getOrderDetail(token, Number(id)),
        getOrderTimeline(token, Number(id)),
        getReturnRequestsForOrder(token, Number(id)).catch(() => []),
      ]);
      setOrder(detail.order);
      setItems(detail.items);
      setTimeline(history);
      setReturnRequests(returns);

      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load order details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCancel = async () => {
    setShowCancelConfirm(false);
    setCancelling(true);
    try {
      const token = await getAuthToken();
      if (!token || !id) return;
      await cancelOrder(token, Number(id));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  const [reordering, setReordering] = useState(false);
  const [reorderMessage, setReorderMessage] = useState("");

  const handleReorder = async () => {
    if (items.length === 0) return;
    setReordering(true);
    setReorderMessage("");
    try {
      const token = await getAuthToken();
      if (!token) return;
      const result = await reorderItems(token, items);
      await refreshCartCount();

      if (result.successCount > 0 && result.failedCount === 0) {
        router.push("/(tabs)/cart" as any);
      } else if (result.successCount > 0 && result.failedCount > 0) {
        setReorderMessage(
          `${result.successCount} item(s) added to cart. ${result.failedCount} item(s) no longer available: ${result.failedItems.join(", ")}`
        );
      } else {
        setReorderMessage("Sorry, none of these items are available anymore.");
      }
    } catch {
      setReorderMessage("Could not reorder. Please try again.");
    } finally {
      setReordering(false);
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
              Order #{id}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : error ? (
            <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), paddingHorizontal: scale(20) }}>{error}</Text>
          ) : order ? (
            <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }} showsVerticalScrollIndicator={false}>
              {/* Status */}
              <Card style={{ marginBottom: scale(16) }}>
                <View style={styles.statusRow}>
                  <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold }}>
                    Status
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) + "22", borderColor: getStatusColor(order.status), paddingHorizontal: scale(10), paddingVertical: scale(4), borderRadius: scale(8) },
                    ]}
                  >
                    <Text style={{ color: getStatusColor(order.status), fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Text>
                  </View>
                </View>

                {order.otp && order.status !== "DELIVERED" && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                  <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(10) }}>
                    Delivery OTP: <Text style={{ color: colors.primary, fontWeight: typography.weight.bold }}>{order.otp}</Text> (share with delivery partner at handover)
                  </Text>
                )}
              </Card>

              {/* Invoice */}
              <Card style={{ marginBottom: scale(16) }}>
                <Pressable onPress={handleDownloadInvoice} disabled={downloadingInvoice}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="document-text-outline" size={scale(20)} color={colors.primary} />
                      <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginLeft: scale(10) }}>
                        Download Invoice
                      </Text>
                    </View>
                    {downloadingInvoice ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="download-outline" size={scale(18)} color={colors.textMuted} />
                    )}
                  </View>
                </Pressable>
                {invoiceError ? (
                  <Text style={{ color: colors.error, fontSize: scale(typography.size.xs), marginTop: scale(8) }}>{invoiceError}</Text>
                ) : null}
              </Card>

              {/* Chat with Seller */}
              <Card style={{ marginBottom: scale(16) }}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: `/chat/${id}` as any,
                      params: { otherPartyName: "Seller" },
                    })
                  }
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="chatbubble-ellipses-outline" size={scale(20)} color={colors.primary} />
                      <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginLeft: scale(10) }}>
                        Chat with Seller
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} />
                  </View>
                </Pressable>
              </Card>

              {/* Reorder */}
              <Card style={{ marginBottom: scale(16) }}>
                <Pressable onPress={handleReorder} disabled={reordering}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="repeat-outline" size={scale(20)} color={colors.primary} />
                      <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginLeft: scale(10) }}>
                        Reorder These Items
                      </Text>
                    </View>
                    {reordering ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} />
                    )}
                  </View>
                </Pressable>
                {reorderMessage ? (
                  <Text style={{ color: colors.warning, fontSize: scale(typography.size.xs), marginTop: scale(8) }}>{reorderMessage}</Text>
                ) : null}
              </Card>

              {/* Timeline */}
              {timeline.length > 0 && (
                <Card style={{ marginBottom: scale(16) }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: scale(16) }}>
                    <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold }}>
                      Order Timeline
                    </Text>
                    {order && isActiveOrder(order.status) ? (
                      <Pressable onPress={() => router.push(`/order/${id}/track` as any)} hitSlop={6}>
                        <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                          Track Order
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {order ? <OrderTimelineTracker status={order.status} history={timeline} /> : null}
                </Card>
              )}

              {/* Items */}
              <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginBottom: scale(10) }}>
                Items
              </Text>
              <Card style={{ marginBottom: scale(16) }}>
                {items.map((item) => {
                  const existingReturn = returnRequests.find((r) => r.orderItemId === item.id);
                  const eligible = order ? canRequestReturn(order.status, order.deliveredAt) : false;

                  return (
                    <View key={item.id} style={{ marginBottom: scale(8) }}>
                      <View style={styles.itemRow}>
                        <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), flex: 1 }} numberOfLines={1}>
                          {item.productName || `Product #${item.productId}`} × {item.quantity}
                        </Text>
                        <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm) }}>₹{item.subtotal}</Text>
                      </View>
                      {existingReturn ? (
                        <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }}>
                          Return {existingReturn.status.toLowerCase()}
                        </Text>
                      ) : eligible ? (
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: "/return-request" as any,
                              params: { orderItemId: item.id, productName: item.productName || `Product #${item.productId}` },
                            })
                          }
                        >
                          <Text style={{ color: colors.primary, fontSize: scale(typography.size.xs), fontWeight: typography.weight.bold, marginTop: scale(2) }}>
                            Return this item
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
                {(order.discountAmount ?? 0) > 0 && (
                  <SummaryRow label="Coupon Discount" value={`- ₹${order.discountAmount}`} />
                )}
                <SummaryRow label="Delivery Fee" value={`₹${order.deliveryFee}`} />
                <SummaryRow label="Order Total" value={`₹${order.totalAmount + (order.walletUsed ?? 0)}`} bold />
                {(order.walletUsed ?? 0) > 0 && (
                  <SummaryRow label="Paid from Wallet" value={`- ₹${order.walletUsed}`} />
                )}
                <SummaryRow
                  label={order.paymentMode === "COD" ? "To Pay on Delivery" : "Amount Payable"}
                  value={`₹${order.totalAmount}`}
                  bold
                  accent
                />
              </Card>

              {/* Delivery address */}
              <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginBottom: scale(10) }}>
                Delivery Address
              </Text>
              <Card style={{ marginBottom: scale(16) }}>
                <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), lineHeight: scale(20) }}>
                  {order.deliveryAddress}
                </Text>
              </Card>

              {canCancelOrder(order.status) && (
                <Button
                  variant="outline"
                  label="Cancel Order"
                  onPress={() => setShowCancelConfirm(true)}
                  loading={cancelling}
                />
              )}
              {(order.status === "DELIVERED" || order.status === "COMPLETED") && (
                <View style={{ marginTop: canCancelOrder(order.status) ? scale(10) : 0 }}>
                  <Button
                    label="Rate & Review"
                    onPress={() => router.push(`/rate-order/${order.id}` as any)}
                  />
                </View>
              )}
            </ScrollView>
          ) : null}
        </View>
      </AppScreenContainer>

      <ConfirmModal
        visible={showCancelConfirm}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This cannot be undone."
        confirmLabel="Yes, Cancel"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    borderWidth: 1,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineDot: {
    marginTop: 5,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});