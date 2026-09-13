import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "../api/client";
import { getOrderDetail, OrderItem } from "../api/orders";
import { getProductById } from "../api/products";
import { rateOrder } from "../api/rating";
import { addProductReview } from "../api/reviews";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { StarRatingInput } from "../components/StarRatingInput";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";

type ItemReviewState = {
  productId: number;
  productName: string;
  rating: number;
  text: string;
  submitted: boolean;
  submitting: boolean;
};

export function RateOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [productRating, setProductRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState("");
  const [orderRatingSubmitting, setOrderRatingSubmitting] = useState(false);
  const [orderRatingSubmitted, setOrderRatingSubmitted] = useState(false);
  const [orderRatingError, setOrderRatingError] = useState("");

  const [items, setItems] = useState<ItemReviewState[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = await getAuthToken();
        if (!token || !id) return;

        const detail = await getOrderDetail(token, Number(id));
        const uniqueProductIds = [...new Set(detail.items.map((i: OrderItem) => i.productId))];
        const products = await Promise.all(uniqueProductIds.map((pid) => getProductById(token, pid).catch(() => null)));

        const nextItems: ItemReviewState[] = uniqueProductIds.map((pid, idx) => ({
          productId: pid,
          productName: products[idx]?.name || `Product #${pid}`,
          rating: 0,
          text: "",
          submitted: false,
          submitting: false,
        }));
        setItems(nextItems);
        setError("");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load order details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleSubmitOrderRating = async () => {
    if (productRating === 0) {
      setOrderRatingError("Please rate the overall order experience.");
      return;
    }
    setOrderRatingSubmitting(true);
    setOrderRatingError("");
    try {
      const token = await getAuthToken();
      if (!token || !id) return;
      await rateOrder(token, Number(id), {
        productRating,
        deliveryRating: deliveryRating || undefined,
        comment: comment || undefined,
      });
      setOrderRatingSubmitted(true);
    } catch (err) {
      setOrderRatingError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not submit rating.");
    } finally {
      setOrderRatingSubmitting(false);
    }
  };

  const updateItem = (productId: number, patch: Partial<ItemReviewState>) => {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, ...patch } : i)));
  };

  const handleSubmitItemReview = async (item: ItemReviewState) => {
    if (item.rating === 0) return;
    updateItem(item.productId, { submitting: true });
    try {
      const token = await getAuthToken();
      if (!token || !id) return;
      await addProductReview(token, item.productId, Number(id), item.rating, item.text || undefined);
      updateItem(item.productId, { submitted: true, submitting: false });
    } catch (err) {
      updateItem(item.productId, { submitting: false });
      setError(err instanceof Error ? err.message : "Could not submit review.");
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
              Rate & Review
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }} showsVerticalScrollIndicator={false}>
              {error ? (
                <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), marginBottom: scale(12) }}>{error}</Text>
              ) : null}

              {/* Overall order rating */}
              <Card style={{ marginBottom: scale(20) }}>
                <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginBottom: scale(12) }}>
                  Rate Your Order
                </Text>

                {orderRatingSubmitted ? (
                  <View style={styles.submittedRow}>
                    <Ionicons name="checkmark-circle" size={scale(20)} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), marginLeft: scale(8), fontWeight: typography.weight.medium }}>
                      Thanks for your feedback!
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), marginBottom: scale(6) }}>
                      Overall experience
                    </Text>
                    <StarRatingInput value={productRating} onChange={setProductRating} size={scale(28)} />

                    <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), marginTop: scale(16), marginBottom: scale(6) }}>
                      Delivery experience (optional)
                    </Text>
                    <StarRatingInput value={deliveryRating} onChange={setDeliveryRating} size={scale(28)} />

                    <TextInput
                      value={comment}
                      onChangeText={setComment}
                      placeholder="Any comments? (optional)"
                      placeholderTextColor={colors.textMuted}
                      multiline
                      style={[styles.commentInput, { borderRadius: scale(10), padding: scale(10), fontSize: scale(typography.size.sm), marginTop: scale(16) }]}
                    />

                    {orderRatingError ? (
                      <Text style={{ color: colors.error, fontSize: scale(typography.size.xs), marginTop: scale(8) }}>{orderRatingError}</Text>
                    ) : null}

                    <View style={{ marginTop: scale(14) }}>
                      <Button label="Submit Rating" onPress={handleSubmitOrderRating} loading={orderRatingSubmitting} />
                    </View>
                  </>
                )}
              </Card>

              {/* Per-product reviews */}
              <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginBottom: scale(12) }}>
                Review Products
              </Text>

              {items.map((item) => (
                <Card key={item.productId} style={{ marginBottom: scale(14) }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm), marginBottom: scale(8) }}>
                    {item.productName}
                  </Text>

                  {item.submitted ? (
                    <View style={styles.submittedRow}>
                      <Ionicons name="checkmark-circle" size={scale(18)} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), marginLeft: scale(8) }}>
                        Review submitted
                      </Text>
                    </View>
                  ) : (
                    <>
                      <StarRatingInput
                        value={item.rating}
                        onChange={(v) => updateItem(item.productId, { rating: v })}
                        size={scale(24)}
                      />
                      <TextInput
                        value={item.text}
                        onChangeText={(v) => updateItem(item.productId, { text: v })}
                        placeholder="Write a review (optional)"
                        placeholderTextColor={colors.textMuted}
                        multiline
                        style={[styles.commentInput, { borderRadius: scale(10), padding: scale(10), fontSize: scale(typography.size.sm), marginTop: scale(10) }]}
                      />
                      <View style={{ marginTop: scale(10) }}>
                        <Button
                          variant="outline"
                          label="Submit Review"
                          onPress={() => handleSubmitItemReview(item)}
                          loading={item.submitting}
                          disabled={item.rating === 0}
                        />
                      </View>
                    </>
                  )}
                </Card>
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
  commentInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    color: colors.textPrimary,
    minHeight: 60,
    textAlignVertical: "top",
  },
  submittedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});