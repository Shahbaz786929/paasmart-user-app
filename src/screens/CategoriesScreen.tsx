import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";

import { addToCart } from "../api/cart";
import { ApiError } from "../api/client";
import { getProducts } from "../api/products";
import type { Product } from "../api/shops";
import { getShopProducts } from "../api/shops";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";
import { getFirstProductImage } from "../utils/productImages";

export function CategoriesScreen() {
    const insets = useSafeAreaInsets();
    const { scale } = useResponsive();
    const { width } = useWindowDimensions();
    const router = useRouter();
    const params = useLocalSearchParams<{ category?: string; shopId?: string }>();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { refreshCartCount } = useCart();
    const [addingId, setAddingId] = useState<number | null>(null);
    const [addedId, setAddedId] = useState<number | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = await getAuthToken();
                if (!token) return;

                const data = params.shopId
                    ? await getShopProducts(token, Number(params.shopId))
                    : await getProducts(token, params.category);

                setProducts(data);
            } catch (err) {
                setError(err instanceof ApiError ? err.message : "Could not load products.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [params.category, params.shopId]);

    const handleAddToCart = async (productId: number) => {
        setAddingId(productId);
        try {
            const token = await getAuthToken();
            if (!token) return;
            await addToCart(token, productId, 1);
            await refreshCartCount();
            setAddedId(productId);
            setTimeout(() => setAddedId(null), 1500); // briefly show "Added" confirmation
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not add item to cart.");
        } finally {
            setAddingId(null);
        }
    };

    const columns = width >= 900 ? 4 : width >= 600 ? 3 : 2;
    const cardWidth = `${100 / columns - 2}%` as const;

    const title = params.category
        ? params.category.charAt(0) + params.category.slice(1).toLowerCase()
        : "Products";

    return (
        <AppBackground>
            <AppScreenContainer>
                <StatusBar barStyle="light-content" />
                <ScrollView
                    contentContainerStyle={{
                        paddingTop: insets.top + scale(20),
                        paddingHorizontal: scale(20),
                        paddingBottom: scale(24),
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.headerRow, { marginBottom: scale(16) }]}>
                        {(params.category || params.shopId) && (
                            <Pressable onPress={() => router.back()} style={{ marginRight: scale(10) }}>
                                <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
                            </Pressable>
                        )}
                        <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy }}>
                            {title}
                        </Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
                    ) : error ? (
                        <Text style={{ color: colors.error, fontSize: scale(typography.size.sm) }}>{error}</Text>
                    ) : products.length === 0 ? (
                        <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm) }}>
                            No products found here yet.
                        </Text>
                    ) : (
                        <View style={styles.grid}>
                            {products.map((product) => (
                                <View key={product.id} style={{ width: cardWidth, marginBottom: scale(14) }}>
                                    <Pressable onPress={() => router.push(`/product/${product.id}` as any)}>
                                        <Card style={{ padding: scale(12) }}>
                                            {getFirstProductImage(product.images) ? (
                                                <Image
                                                    source={{ uri: getFirstProductImage(product.images)! }}
                                                    style={{
                                                        width: "100%",
                                                        height: scale(90),
                                                        borderRadius: scale(10),
                                                        marginBottom: scale(8),
                                                    }}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View
                                                    style={{
                                                        width: "100%",
                                                        height: scale(90),
                                                        borderRadius: scale(10),
                                                        marginBottom: scale(8),
                                                        backgroundColor: colors.surface,
                                                        borderWidth: 1,
                                                        borderColor: colors.surfaceBorder,
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <Ionicons name="image-outline" size={scale(24)} color={colors.textMuted} />
                                                </View>
                                            )}
                                            <Text numberOfLines={1} style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm) }}>
                                                {product.name}
                                            </Text>
                                            <Text
                                                numberOfLines={3}
                                                style={{
                                                    color: colors.textMuted,
                                                    fontSize: scale(typography.size.sm),
                                                    lineHeight: scale(18),
                                                    marginTop: scale(6),
                                                    marginBottom: scale(8),
                                                }}
                                            >
                                                {product.description}
                                            </Text>
                                            <Text style={{ color: colors.primary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm), marginTop: scale(4) }}>
                                                ₹{product.price}
                                                {product.discountPercent > 0 && (
                                                    <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), fontWeight: typography.weight.regular }}>
                                                        {"  "}({product.discountPercent}% off)
                                                    </Text>
                                                )}
                                            </Text>
                                            {product.stockQty === 0 && (
                                                <Text style={{ color: colors.error, fontSize: scale(typography.size.xs), marginTop: scale(4) }}>
                                                    Out of stock
                                                </Text>
                                            )}

                                            {product.stockQty > 0 && (
                                                <Pressable
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        handleAddToCart(product.id);
                                                    }}
                                                    disabled={addingId === product.id}
                                                    style={{
                                                        marginTop: scale(8),
                                                        backgroundColor: addedId === product.id ? colors.primaryDark : colors.primary,
                                                        borderRadius: scale(8),
                                                        paddingVertical: scale(6),
                                                        alignItems: "center",
                                                        opacity: addingId === product.id ? 0.7 : 1,
                                                    }}
                                                >
                                                    {addingId === product.id ? (
                                                        <ActivityIndicator size="small" color={colors.white} />
                                                    ) : (
                                                        <Text style={{ color: colors.white, fontSize: scale(typography.size.xs), fontWeight: typography.weight.bold }}>
                                                            {addedId === product.id ? "Added ✓" : "Add to Cart"}
                                                        </Text>
                                                    )}
                                                </Pressable>

                                            )}
                                        </Card>
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </AppScreenContainer>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    imagePlaceholder: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.surfaceBorder,
        justifyContent: "center",
        alignItems: "center",
    },
});