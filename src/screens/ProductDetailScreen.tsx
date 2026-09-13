import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { addToCart } from "../api/cart";
import { ApiError } from "../api/client";
import { getProductById, getProducts } from "../api/products";
import { getProductReviews, markReviewHelpful, ProductReviewSummary } from "../api/reviews";
import type { Product } from "../api/shops";
import { addToWishlist, getWishlist, removeFromWishlist } from "../api/wishlist";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { RatingStars } from "../components/RatingStars";
import { useCart } from "../context/CartContext";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";
import { getFirstProductImage, parseProductImages } from "../utils/productImages";

// Product photography ek neutral, halke background par sabse professional dikhti hai —
// Flipkart/Amazon dono ismi wajah se off-white canvas use karte hain, app ki theme chahe dark ho.
const IMAGE_CANVAS_BG = "#F5F5F7";

function effectivePrice(product: Product): number {
  return product.discountPercent > 0
    ? Math.round(product.price * (1 - product.discountPercent / 100))
    : product.price;
}

export function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refreshCartCount } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummary | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);
  const [helpfulBusyId, setHelpfulBusyId] = useState<number | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<number | null>(null);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [notifyingStock, setNotifyingStock] = useState(false);
  const [galleryWidth, setGalleryWidth] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const galleryScrollRef = useRef<ScrollView>(null);

  const relatedColumns = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const relatedCardWidth = `${100 / relatedColumns - 2.5}%` as const;

  const goToImage = (index: number) => {
    galleryScrollRef.current?.scrollTo({ x: index * galleryWidth, animated: true });
    setActiveImage(index);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = await getAuthToken();
        if (!token || !id) return;

        const [productData, reviewData, wishlist] = await Promise.all([
          getProductById(token, Number(id)),
          getProductReviews(Number(id), token).catch(() => null),
          getWishlist(token).catch(() => []),
        ]);

        setProduct(productData);
        setReviewSummary(reviewData);
        const existingWishlistItem = wishlist.find((w) => w.product.id === productData.id);
        setIsWishlisted(!!existingWishlistItem);
        setWishlistId(existingWishlistItem ? existingWishlistItem.id : null);
        setError("");

        // Related products — same category ke baaki products, current product hata kar
        getProducts(token, productData.category)
          .then((all) => setRelatedProducts(all.filter((p) => p.id !== productData.id)))
          .catch(() => setRelatedProducts([]));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load product details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    setActiveImage(0);
  }, [product?.id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      await addToCart(token, product.id, 1);
      await refreshCartCount();
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleNotifyMe = async () => {
    if (!product || isWishlisted) return;
    setNotifyingStock(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const created = await addToWishlist(token, product.id);
      setIsWishlisted(true);
      setWishlistId(created.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not set up notification.");
    } finally {
      setNotifyingStock(false);
    }
  };

  const toggleWishlist = async () => {
    if (!product || wishlistBusy) return;
    setWishlistBusy(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      if (isWishlisted && wishlistId) {
        await removeFromWishlist(token, wishlistId);
        setIsWishlisted(false);
        setWishlistId(null);
      } else {
        const created = await addToWishlist(token, product.id);
        setIsWishlisted(true);
        setWishlistId(created.id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update wishlist.");
    } finally {
      setWishlistBusy(false);
    }
  };

  const handleHelpful = async (reviewId: number) => {
    setHelpfulBusyId(reviewId);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const updated = await markReviewHelpful(token, reviewId);
      setReviewSummary((prev) =>
        prev
          ? { ...prev, reviews: prev.reviews.map((r) => (r.id === reviewId ? updated : r)) }
          : prev
      );
    } catch {
      // Non-critical — silently ignore.
    } finally {
      setHelpfulBusyId(null);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const productImages = product ? parseProductImages(product.images) : [];

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingTop: insets.top + scale(16) }}>
          <View style={[styles.headerRow, { paddingHorizontal: scale(20), marginBottom: scale(12) }]}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/home"))}
              style={{ marginRight: scale(10) }}
            >
              <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
            </Pressable>
            <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy, flex: 1 }} numberOfLines={1}>
              Product Details
            </Text>
            {product && (
              <Pressable onPress={toggleWishlist} disabled={wishlistBusy} hitSlop={8}>
                <Ionicons
                  name={isWishlisted ? "heart" : "heart-outline"}
                  size={scale(24)}
                  color={isWishlisted ? colors.error : colors.textPrimary}
                />
              </Pressable>
            )}
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : error ? (
            <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), paddingHorizontal: scale(20) }}>{error}</Text>
          ) : product ? (
            <>
              <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(16) }} showsVerticalScrollIndicator={false}>
                {/* Product image gallery — professional off-white canvas, image poori dikhti hai crop hue bina */}
                <View
                  style={{ marginBottom: scale(16), position: "relative" }}
                  onLayout={(e) => setGalleryWidth(e.nativeEvent.layout.width)}
                >
                  {productImages.length === 0 ? (
                    <View
                      style={{
                        width: "100%",
                        height: scale(260),
                        borderRadius: scale(16),
                        backgroundColor: IMAGE_CANVAS_BG,
                        borderWidth: 1,
                        borderColor: colors.surfaceBorder,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="image-outline" size={scale(48)} color="#B0B0B5" />
                      <Text style={{ color: "#8A8A90", fontSize: scale(typography.size.sm), marginTop: scale(8) }}>
                        No image available
                      </Text>
                    </View>
                  ) : (
                    <>
                      <ScrollView
                        ref={galleryScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                          if (galleryWidth > 0) {
                            const idx = Math.round(e.nativeEvent.contentOffset.x / galleryWidth);
                            setActiveImage(idx);
                          }
                        }}
                        scrollEventThrottle={16}
                        style={{
                          borderRadius: scale(16),
                          overflow: "hidden",
                          backgroundColor: IMAGE_CANVAS_BG,
                          borderWidth: 1,
                          borderColor: "rgba(0,0,0,0.06)",
                        }}
                      >
                        {productImages.map((uri, index) => (
                          <View
                            key={index}
                            style={{
                              width: galleryWidth,
                              height: scale(260),
                              alignItems: "center",
                              justifyContent: "center",
                              padding: scale(20),
                            }}
                          >
                            <Image
                              source={{ uri }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode="contain"
                            />
                          </View>
                        ))}
                      </ScrollView>

                      {productImages.length > 1 && (
                        <>
                          <View
                            style={{
                              position: "absolute",
                              top: scale(10),
                              right: scale(10),
                              backgroundColor: "rgba(0,0,0,0.6)",
                              paddingHorizontal: scale(8),
                              paddingVertical: scale(4),
                              borderRadius: scale(10),
                            }}
                          >
                            <Text style={{ color: colors.white, fontSize: scale(typography.size.xs), fontWeight: typography.weight.bold }}>
                              {activeImage + 1}/{productImages.length}
                            </Text>
                          </View>

                          {activeImage > 0 && (
                            <Pressable
                              onPress={() => goToImage(activeImage - 1)}
                              style={{
                                position: "absolute",
                                left: scale(8),
                                top: 0,
                                bottom: 0,
                                justifyContent: "center",
                              }}
                              hitSlop={10}
                            >
                              <View
                                style={{
                                  width: scale(32),
                                  height: scale(32),
                                  borderRadius: scale(16),
                                  backgroundColor: "rgba(0,0,0,0.5)",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Ionicons name="chevron-back" size={scale(18)} color={colors.white} />
                              </View>
                            </Pressable>
                          )}

                          {activeImage < productImages.length - 1 && (
                            <Pressable
                              onPress={() => goToImage(activeImage + 1)}
                              style={{
                                position: "absolute",
                                right: scale(8),
                                top: 0,
                                bottom: 0,
                                justifyContent: "center",
                              }}
                              hitSlop={10}
                            >
                              <View
                                style={{
                                  width: scale(32),
                                  height: scale(32),
                                  borderRadius: scale(16),
                                  backgroundColor: "rgba(0,0,0,0.5)",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Ionicons name="chevron-forward" size={scale(18)} color={colors.white} />
                              </View>
                            </Pressable>
                          )}

                          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: scale(10) }}>
                            {productImages.map((_, index) => (
                              <Pressable key={index} onPress={() => goToImage(index)} hitSlop={6}>
                                <View
                                  style={{
                                    width: index === activeImage ? scale(18) : scale(6),
                                    height: scale(6),
                                    borderRadius: scale(3),
                                    backgroundColor: index === activeImage ? colors.primary : colors.surfaceBorder,
                                    marginHorizontal: scale(3),
                                  }}
                                />
                              </Pressable>
                            ))}
                          </View>
                        </>
                      )}
                    </>
                  )}
                </View>

                {/* Name, category, price */}
                <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs) }}>
                  {product.category}
                  {product.subCategory ? ` · ${product.subCategory}` : ""}
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy, marginTop: scale(4) }}>
                  {product.name}
                </Text>

                {reviewSummary && reviewSummary.totalReviews > 0 && (
                  <View style={[styles.ratingRow, { marginTop: scale(8) }]}>
                    <RatingStars rating={reviewSummary.averageRating} size={scale(16)} />
                    <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), marginLeft: scale(8) }}>
                      {reviewSummary.averageRating.toFixed(1)} ({reviewSummary.totalReviews} reviews)
                    </Text>
                  </View>
                )}

                <View style={[styles.priceRow, { marginTop: scale(12) }]}>
                  <Text style={{ color: colors.primary, fontSize: scale(typography.size.xl), fontWeight: typography.weight.heavy }}>
                    ₹{effectivePrice(product)}
                  </Text>
                  {product.discountPercent > 0 && (
                    <>
                      <Text
                        style={{
                          color: colors.textMuted,
                          fontSize: scale(typography.size.sm),
                          marginLeft: scale(10),
                          textDecorationLine: "line-through",
                        }}
                      >
                        ₹{product.price}
                      </Text>
                      <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), marginLeft: scale(8), fontWeight: typography.weight.bold }}>
                        {product.discountPercent}% off
                      </Text>
                    </>
                  )}
                </View>

                <Text
                  style={{
                    color: product.stockQty > 0 ? colors.primary : colors.error,
                    fontSize: scale(typography.size.sm),
                    marginTop: scale(6),
                    fontWeight: typography.weight.medium,
                  }}
                >
                  {product.stockQty > 0 ? `In Stock (${product.stockQty} available)` : "Out of Stock"}
                </Text>

                {/* Description */}
                {product.description && (
                  <>
                    <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginTop: scale(20), marginBottom: scale(8) }}>
                      Description
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), lineHeight: scale(20) }}>
                      {product.description}
                    </Text>
                  </>
                )}

                {/* Reviews section */}
                <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginTop: scale(24), marginBottom: scale(10) }}>
                  Ratings & Reviews
                </Text>

                {!reviewSummary || reviewSummary.totalReviews === 0 ? (
                  <Card>
                    <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm) }}>
                      No reviews yet for this product.
                    </Text>
                  </Card>
                ) : (
                  <>
                    {/* Rating breakdown */}
                    <Card style={{ marginBottom: scale(14) }}>
                      <View style={styles.summaryRow}>
                        <View style={{ alignItems: "center", marginRight: scale(20) }}>
                          <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.xxl), fontWeight: typography.weight.heavy }}>
                            {reviewSummary.averageRating.toFixed(1)}
                          </Text>
                          <RatingStars rating={reviewSummary.averageRating} size={scale(14)} />
                          <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(4) }}>
                            {reviewSummary.totalReviews} reviews
                          </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = reviewSummary.ratingBreakdown[String(star)] || 0;
                            const pct = reviewSummary.totalReviews > 0 ? (count / reviewSummary.totalReviews) * 100 : 0;
                            return (
                              <View key={star} style={[styles.breakdownRow, { marginBottom: scale(4) }]}>
                                <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), width: scale(14) }}>{star}</Text>
                                <View style={[styles.breakdownTrack, { marginHorizontal: scale(6), borderRadius: scale(4) }]}>
                                  <View style={[styles.breakdownFill, { width: `${pct}%`, borderRadius: scale(4) }]} />
                                </View>
                                <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), width: scale(20) }}>{count}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    </Card>

                    {/* Individual reviews */}
                    {reviewSummary.reviews.map((review) => (
                      <Card key={review.id} style={{ marginBottom: scale(12) }}>
                        <View style={styles.reviewHeader}>
                          <RatingStars rating={review.rating} size={scale(14)} />
                          <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs) }}>
                            {formatDate(review.createdAt)}
                          </Text>
                        </View>

                        {review.reviewText && (
                          <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm), marginTop: scale(8), lineHeight: scale(20) }}>
                            {review.reviewText}
                          </Text>
                        )}

                        {review.sellerReply && (
                          <View style={[styles.sellerReplyBox, { marginTop: scale(10), padding: scale(10), borderRadius: scale(8) }]}>
                            <Text style={{ color: colors.primary, fontSize: scale(typography.size.xs), fontWeight: typography.weight.bold, marginBottom: scale(4) }}>
                              Seller Response
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.xs), lineHeight: scale(18) }}>
                              {review.sellerReply}
                            </Text>
                          </View>
                        )}

                        <Pressable
                          onPress={() => handleHelpful(review.id)}
                          disabled={helpfulBusyId === review.id}
                          style={[styles.helpfulRow, { marginTop: scale(10) }]}
                        >
                          <Ionicons name="thumbs-up-outline" size={scale(14)} color={colors.textMuted} />
                          <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginLeft: scale(6) }}>
                            Helpful{review.helpfulCount > 0 ? ` (${review.helpfulCount})` : ""}
                          </Text>
                        </Pressable>
                      </Card>
                    ))}
                  </>
                )}

                {/* Related products — vertical grid, jaise category/search listing mein hota hai */}
                {relatedProducts.length > 0 && (
                  <>
                    <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginTop: scale(28), marginBottom: scale(12) }}>
                      You may also like
                    </Text>
                    <View style={styles.relatedGrid}>
                      {relatedProducts.map((item) => (
                        <View key={item.id} style={{ width: relatedCardWidth, marginBottom: scale(14) }}>
                          <Pressable onPress={() => router.push(`/product/${item.id}` as any)}>
                            <Card style={{ padding: scale(10) }}>
                              {getFirstProductImage(item.images) ? (
                                <View
                                  style={{
                                    width: "100%",
                                    height: scale(100),
                                    borderRadius: scale(10),
                                    marginBottom: scale(8),
                                    backgroundColor: IMAGE_CANVAS_BG,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: scale(8),
                                  }}
                                >
                                  <Image
                                    source={{ uri: getFirstProductImage(item.images)! }}
                                    style={{ width: "100%", height: "100%" }}
                                    resizeMode="contain"
                                  />
                                </View>
                              ) : (
                                <View
                                  style={{
                                    width: "100%",
                                    height: scale(100),
                                    borderRadius: scale(10),
                                    marginBottom: scale(8),
                                    backgroundColor: IMAGE_CANVAS_BG,
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Ionicons name="cube-outline" size={scale(24)} color="#B0B0B5" />
                                </View>
                              )}
                              <Text numberOfLines={1} style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm) }}>
                                {item.name}
                              </Text>
                              <View style={{ flexDirection: "row", alignItems: "center", marginTop: scale(4) }}>
                                <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.heavy }}>
                                  ₹{effectivePrice(item)}
                                </Text>
                                {item.discountPercent > 0 && (
                                  <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginLeft: scale(6), textDecorationLine: "line-through" }}>
                                    ₹{item.price}
                                  </Text>
                                )}
                              </View>
                            </Card>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>

              {/* Sticky footer — stock hai to Add to Cart, warna Notify Me */}
              <View style={[styles.footer, { paddingHorizontal: scale(20), paddingTop: scale(12), paddingBottom: insets.bottom + scale(12) }]}>
                {product.stockQty === 0 ? (
                  <Button
                    variant={isWishlisted ? "outline" : undefined}
                    label={isWishlisted ? "We'll notify you ✓" : "Notify Me When Back In Stock"}
                    onPress={handleNotifyMe}
                    loading={notifyingStock}
                    disabled={isWishlisted}
                  />
                ) : (
                  <Button
                    label={added ? "Added to Cart ✓" : "Add to Cart"}
                    onPress={handleAddToCart}
                    loading={addingToCart}
                  />
                )}
              </View>
            </>
          ) : null}
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
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  breakdownTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  breakdownFill: {
    height: "100%",
    backgroundColor: "#F59E0B",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sellerReplyBox: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
  },
  helpfulRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  relatedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  footer: {
    backgroundColor: "rgba(15,15,15,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
});