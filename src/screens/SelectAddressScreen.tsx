import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Address, deleteAddress, getAddresses, setDefaultAddress } from "../api/address";
import { ApiError } from "../api/client";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Card } from "../components/Card";
import { ConfirmModal } from "../components/ConfirmModal";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";

export function SelectAddressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const list = await getAddresses(token);
      setAddresses(list);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load addresses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSelect = async (addr: Address) => {
    if (addr.defaultAddress) {
      router.back();
      return;
    }
    setBusyId(addr.id);
    try {
      const token = await getAuthToken();
      if (!token) return;
      await setDefaultAddress(token, addr.id);
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not select this address.");
    } finally {
      setBusyId(null);
    }
  };

  const handleEdit = (addr: Address) => {
    router.push({ pathname: "/add-address" as any, params: { addressId: addr.id } });
  };

  const handleDelete = (addr: Address) => {
    setDeleteTarget(addr);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const addr = deleteTarget;
    setDeleteTarget(null);
    setBusyId(addr.id);
    try {
      const token = await getAuthToken();
      if (!token) return;
      await deleteAddress(token, addr.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete address.");
    } finally {
      setBusyId(null);
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
            <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy, flex: 1 }}>
              Select Address
            </Text>
            <Pressable onPress={() => router.push("/add-address" as any)}>
              <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.medium }}>
                + Add New
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(24) }} showsVerticalScrollIndicator={false}>
              {error ? (
                <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), marginBottom: scale(10) }}>{error}</Text>
              ) : null}

              {addresses.length === 0 ? (
                <Card>
                  <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.sm) }}>
                    No saved addresses yet. Tap "+ Add New" above.
                  </Text>
                </Card>
              ) : (
                addresses.map((addr) => (
                  <Card
                    key={addr.id}
                    style={{
                      marginBottom: scale(10),
                      borderColor: addr.defaultAddress ? colors.primary : colors.surfaceBorder,
                      borderWidth: addr.defaultAddress ? 2 : 1,
                    }}
                  >
                    <Pressable onPress={() => handleSelect(addr)} disabled={busyId === addr.id}>
                      <View style={styles.addressRow}>
                        <Ionicons
                          name={addr.defaultAddress ? "radio-button-on" : "radio-button-off"}
                          size={scale(20)}
                          color={addr.defaultAddress ? colors.primary : colors.textMuted}
                        />
                        <View style={{ marginLeft: scale(10), flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ color: colors.textPrimary, fontWeight: typography.weight.bold, fontSize: scale(typography.size.sm) }}>
                              {addr.fullName}
                            </Text>
                            {addr.defaultAddress && (
                              <Text style={{ color: colors.primary, fontSize: scale(typography.size.xs), marginLeft: scale(8) }}>
                                (Selected)
                              </Text>
                            )}
                          </View>
                          <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }}>
                            {addr.houseNo}, {addr.area}
                            {addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(2) }}>
                            📞 {addr.mobileNumber}
                          </Text>
                        </View>
                      </View>
                    </Pressable>

                    <View style={[styles.actionsRow, { marginTop: scale(10), paddingTop: scale(10) }]}>
                      <Pressable style={styles.actionBtn} onPress={() => handleEdit(addr)} disabled={busyId === addr.id}>
                        <Ionicons name="pencil-outline" size={scale(16)} color={colors.textSecondary} />
                        <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.xs), marginLeft: scale(4) }}>Edit</Text>
                      </Pressable>
                      <Pressable style={styles.actionBtn} onPress={() => handleDelete(addr)} disabled={busyId === addr.id}>
                        {busyId === addr.id ? (
                          <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                          <>
                            <Ionicons name="trash-outline" size={scale(16)} color={colors.error} />
                            <Text style={{ color: colors.error, fontSize: scale(typography.size.xs), marginLeft: scale(4) }}>Delete</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </Card>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </AppScreenContainer>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Address"
        message={`Remove the address for ${deleteTarget?.fullName}?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  actionsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
});