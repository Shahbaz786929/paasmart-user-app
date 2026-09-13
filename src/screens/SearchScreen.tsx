import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "../api/client";
import { search, SearchResult } from "../api/search";
import type { Product } from "../api/shops";
import { resolveImageUrl } from "../api/shops";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";
import { getFirstProductImage } from "../utils/productImages";

const DEBOUNCE_MS = 400;

type SortOption = "relevance" | "price_asc" | "price_desc" | "discount";
const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "discount", label: "Best Discount" },
];

type PriceBucket = { key: string; label: string; min: number; max: number | null };
const PRICE_BUCKETS: PriceBucket[] = [
  { key: "under500", label: "Under ₹500", min: 0, max: 500 },
  { key: "500to1000", label: "₹500 - ₹1000", min: 500, max: 1000 },
  { key: "1000to2000", label: "₹1000 - ₹2000", min: 1000, max: 2000 },
  { key: "above2000", label: "Above ₹2000", min: 2000, max: null },
];

function effectivePrice(product: Product): number {
  return product.discountPercent > 0
    ? Math.round(product.price * (1 - product.discountPercent / 100))
    : product.price;
}

export function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceBucket, setSelectedPriceBucket] = useState<string | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResult(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const token = await getAuthToken();
        const data = await search(token, trimmed);
        setResult(data);
        setError("");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Naya search hote hi purane filters reset kar do — pehli baar ke results ke hisaab se
  // categories list badalti rehti hai, purana selection confusing lagega
  useEffect(() => {
    setSelectedCategories([]);
    setSelectedPriceBucket(null);
    setSortBy("relevance");
  }, [result === null]);

  const availableCategories = useMemo(() => {
    if (!result) return [];
    return [...new Set(result.products.map((p) => p.category))].sort();
  }, [result]);

  const filteredProducts = useMemo(() => {
    if (!result) return [];
    let list = [...result.products];

    if (selectedCategories.length > 0) {
      list = list.filter((p) => selectedCategories.includes(p.category));
    }

    if (selectedPriceBucket) {
      const bucket = PRICE_BUCKETS.find((b) => b.key === selectedPriceBucket);
      if (bucket) {
        list = list.filter((p) => {
          const price = effectivePrice(p);
          return price >= bucket.min && (bucket.max === null || price < bucket.max);
        });
      }
    }

    if (sortBy === "price_asc") {
      list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    } else if (sortBy === "discount") {
      list.sort((a, b) => b.discountPercent - a.discountPercent);
    }
    // "relevance" — backend se aaya order hi rakho (similarity-sorted)

    return list;
  }, [result, selectedCategories, selectedPriceBucket, sortBy]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedPriceBucket(null);
    setSortBy("relevance");
  };

  const activeFilterCount = selectedCategories.length + (selectedPriceBucket ? 1 : 0) + (sortBy !== "relevance" ? 1 : 0);

  const hasSearched = query.trim().length > 0;
  const hasShopResults = result && result.shops.length > 0;
  const hasProductResults = result && result.products.length > 0;
  const hasAnyResults = hasShopResults || hasProductResults;

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, paddingTop: insets.top + scale(16) }}>
          {/* Search input row */}
          <View style={[styles.headerRow, { paddingHorizontal: scale(20), marginBottom: scale(12) }]}>
            <Pressable onPress={() => router.back()} style={{ marginRight: scale(10) }}>
              <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
            </Pressable>
            <View style={[styles.inputRow, { borderRadius: scale(12), paddingHorizontal: scale(12), height: scale(44) }]}>
              <Ionicons name="search" size={scale(18)} color={colors.textMuted} />
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Search products, stores..."
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { fontSize: scale(typography.size.sm), marginLeft: scale(8) }]}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")}>
                  <Ionicons name="close-circle" size={scale(18)} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
            {hasProductResults ? (
              <Pressable
                onPress={() => setShowFilters((prev) => !prev)}
                style={{ marginLeft: scale(10), position: "relative" }}
              >
                <View
                  style={[
                    styles.filterButton,
                    { width: scale(44), height: scale(44), borderRadius: scale(12) },
                    showFilters && styles.filterButtonActive,
                  ]}
                >
                  <Ionicons name="options-outline" size={scale(20)} color={showFilters ? colors.primary : colors.textPrimary} />
                </View>
                {activeFilterCount > 0 ? (
                  <View style={[styles.filterBadge, { width: scale(16), height: scale(16), borderRadius: scale(8) }]}>
                    <Text style={{ color: colors.white, fontSize: scale(9), fontWeight: typography.weight.bold }}>{activeFilterCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            ) : null}
          </View>

          {/* Filter panel */}
          {showFilters && hasProductResults ? (
            <View style={{ paddingHorizontal: scale(20), marginBottom: scale(12) }}>
              <Card>
                <View style={styles.filterHeaderRow}>
                  <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                    Sort by
                  </Text>
                  {activeFilterCount > 0 ? (
                    <Pressable onPress={clearFilters} hitSlop={6}>
                      <Text style={{ color: colors.error, fontSize: scale(typography.size.xs), fontWeight: typography.weight.medium }}>
                        Clear all
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: scale(8) }}>
                  {SORT_OPTIONS.map((opt) => (
                    <Chip
                      key={opt.key}
                      label={opt.label}
                      active={sortBy === opt.key}
                      onPress={() => setSortBy(opt.key)}
                      scale={scale}
                    />
                  ))}
                </ScrollView>

                {availableCategories.length > 1 ? (
                  <>
                    <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginTop: scale(14) }}>
                      Category
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: scale(8) }}>
                      {availableCategories.map((cat) => (
                        <Chip
                          key={cat}
                          label={cat}
                          active={selectedCategories.includes(cat)}
                          onPress={() => toggleCategory(cat)}
                          scale={scale}
                        />
                      ))}
                    </ScrollView>
                  </>
                ) : null}

                <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginTop: scale(14) }}>
                  Price
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: scale(8) }}>
                  {PRICE_BUCKETS.map((bucket) => (
                    <Chip
                      key={bucket.key}
                      label={bucket.label}
                      active={selectedPriceBucket === bucket.key}
                      onPress={() => setSelectedPriceBucket((prev) => (prev === bucket.key ? null : bucket.key))}
                      scale={scale}
                    />
                  ))}
                </ScrollView>
              </Card>
            </View>
          ) : null}

          <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }} showsVerticalScrollIndicator={false}>
            {!hasSearched ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={scale(56)} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(12) }}>
                  Search for products or stores
                </Text>
              </View>
            ) : loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
            ) : error ? (
              <Text style={{ color: colors.error, fontSize: scale(typography.size.sm) }}>{error}</Text>
            ) : !hasAnyResults ? (
              <View style={styles.emptyState}>
                <Ionicons name="sad-outline" size={scale(56)} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(12) }}>
                  No results found for "{query}"
                </Text>
              </View>
            ) : (
              <>
                {hasShopResults && (
                  <>
                    <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold, marginBottom: scale(10) }}>
                      Stores
                    </Text>
                    {result!.shops.map((shop) => (
                      <Pressable key={shop.id} onPress={() => router.push({ pathname: "/(tabs)/categories" as any, params: { shopId: shop.id } })}>
                        <Card style={{ marginBottom: scale(10) }}>
                          <View style={styles.itemRow}>
                            <View style={[styles.thumb, { width: scale(44), height: scale(44), borderRadius: scale(12) }]}>
                              {resolveImageUrl(shop.logoUrl) ? (
                                <Image source={{ uri: resolveImageUrl(shop.logoUrl)! }} style={{ width: scale(44), height: scale(44), borderRadius: scale(12) }} resizeMode="cover" />
                              ) : (
                                <Ionicons name="storefront" size={scale(20)} color={colors.primary} />
                              )}
                            </View>
                            <View style={{ marginLeft: scale(12), flex: 1 }}>
                              <Text style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm) }}>
                                {shop.shopName}
                              </Text>
                              <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }}>
                                {shop.category}
                              </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} />
                          </View>
                        </Card>
                      </Pressable>
                    ))}
                  </>
                )}

                {hasProductResults && (
                  <>
                    <View style={[styles.filterHeaderRow, { marginTop: scale(16), marginBottom: scale(10) }]}>
                      <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.md), fontWeight: typography.weight.bold }}>
                        Products
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs) }}>
                        {filteredProducts.length} of {result!.products.length}
                      </Text>
                    </View>

                    {filteredProducts.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Ionicons name="filter-outline" size={scale(48)} color={colors.textMuted} />
                        <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm), marginTop: scale(10) }}>
                          No products match these filters
                        </Text>
                        <Pressable onPress={clearFilters} style={{ marginTop: scale(8) }}>
                          <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold }}>
                            Clear filters
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      filteredProducts.map((product) => (
                        <Pressable key={product.id} onPress={() => router.push(`/product/${product.id}` as any)}>
                          <Card style={{ marginBottom: scale(10) }}>
                            <View style={styles.itemRow}>
                              <View style={[styles.thumb, { width: scale(44), height: scale(44), borderRadius: scale(10) }]}>
                                {getFirstProductImage(product.images) ? (
                                  <Image
                                    source={{ uri: getFirstProductImage(product.images)! }}
                                    style={{ width: scale(44), height: scale(44), borderRadius: scale(10) }}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <Ionicons name="cube-outline" size={scale(18)} color={colors.textMuted} />
                                )}
                              </View>
                              <View style={{ marginLeft: scale(12), flex: 1 }}>
                                <Text numberOfLines={1} style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm) }}>
                                  {product.name}
                                </Text>
                                <View style={{ flexDirection: "row", alignItems: "center", marginTop: scale(2) }}>
                                  <Text style={{ color: colors.primary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.xs) }}>
                                    ₹{effectivePrice(product)}
                                  </Text>
                                  {product.discountPercent > 0 ? (
                                    <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginLeft: scale(6), textDecorationLine: "line-through" }}>
                                      ₹{product.price}
                                    </Text>
                                  ) : null}
                                </View>
                              </View>
                              <Ionicons name="chevron-forward" size={scale(18)} color={colors.textMuted} />
                            </View>
                          </Card>
                        </Pressable>
                      ))
                    )}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </AppScreenContainer>
    </AppBackground>
  );
}

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  scale: (n: number) => number;
};

function Chip({ label, active, onPress, scale }: ChipProps) {
  return (
    <Pressable onPress={onPress} style={{ marginRight: scale(8) }}>
      <View
        style={[
          styles.chip,
          {
            paddingHorizontal: scale(12),
            paddingVertical: scale(7),
            borderRadius: scale(16),
          },
          active && styles.chipActive,
        ]}
      >
        <Text
          style={{
            color: active ? colors.primary : colors.textSecondary,
            fontSize: scale(typography.size.xs),
            fontWeight: active ? typography.weight.bold : typography.weight.medium,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
  },
  filterButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonActive: {
    borderColor: colors.primary,
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  filterHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumb: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
});