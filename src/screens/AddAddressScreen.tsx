import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { addAddress, getAddresses, updateAddress } from "../api/address";
import { ApiError } from "../api/client";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Button } from "../components/Button";
import { Checkbox } from "../components/Checkbox";
import { Input } from "../components/Input";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken } from "../utils/authStorage";

type FormState = {
  fullName: string;
  mobileNumber: string;
  houseNo: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

const EMPTY_FORM: FormState = {
  fullName: "",
  mobileNumber: "",
  houseNo: "",
  area: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
};

export function AddAddressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();
  const { addressId } = useLocalSearchParams<{ addressId?: string }>();
  const isEditMode = !!addressId;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [makeDefault, setMakeDefault] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);

  // In edit mode, load the existing address (the API only exposes a list
  // endpoint, so we fetch all and find the one we need — no separate
  // "get by id" endpoint exists on the backend).
  useEffect(() => {
    if (!isEditMode) return;

    const loadExisting = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;
        const list = await getAddresses(token);
        const existing = list.find((a) => a.id === Number(addressId));
        if (existing) {
          setForm({
            fullName: existing.fullName,
            mobileNumber: existing.mobileNumber,
            houseNo: existing.houseNo,
            area: existing.area,
            landmark: existing.landmark || "",
            city: existing.city,
            state: existing.state,
            pincode: existing.pincode,
          });
          setMakeDefault(existing.defaultAddress);
        }
      } catch (err) {
        setGeneralError(err instanceof ApiError ? err.message : "Could not load address details.");
      } finally {
        setLoadingExisting(false);
      }
    };

    loadExisting();
  }, [addressId, isEditMode]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Required";
    if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) nextErrors.mobileNumber = "Enter a valid 10-digit number";
    if (!form.houseNo.trim()) nextErrors.houseNo = "Required";
    if (!form.area.trim()) nextErrors.area = "Required";
    if (!form.city.trim()) nextErrors.city = "Required";
    if (!form.state.trim()) nextErrors.state = "Required";
    if (!/^\d{6}$/.test(form.pincode)) nextErrors.pincode = "Enter a valid 6-digit pincode";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    setGeneralError("");
    try {
      const token = await getAuthToken();
      if (!token) return;

      const payload = {
        fullName: form.fullName,
        mobileNumber: form.mobileNumber,
        houseNo: form.houseNo,
        area: form.area,
        landmark: form.landmark || undefined,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        defaultAddress: makeDefault,
      };

      if (isEditMode) {
        await updateAddress(token, Number(addressId), payload);
      } else {
        await addAddress(token, payload);
      }

      router.back();
    } catch (err) {
      setGeneralError(err instanceof ApiError ? err.message : "Could not save address.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingExisting) {
    return (
      <AppBackground>
        <AppScreenContainer>
          <StatusBar barStyle="light-content" />
        </AppScreenContainer>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: scale(20),
              paddingTop: insets.top + scale(20),
              paddingBottom: scale(30),
            }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy, marginBottom: scale(16) }}>
              {isEditMode ? "Edit Address" : "Add New Address"}
            </Text>

            <Input label="Full Name" placeholder="Enter your full name" value={form.fullName} onChangeText={(v) => updateField("fullName", v)} error={errors.fullName} />
            <Input label="Mobile Number" placeholder="Enter your mobile number" keyboardType="phone-pad" maxLength={10} value={form.mobileNumber} onChangeText={(v) => updateField("mobileNumber", v)} error={errors.mobileNumber} />
            <Input label="House / Flat No." placeholder="Enter your flat number" value={form.houseNo} onChangeText={(v) => updateField("houseNo", v)} error={errors.houseNo} />
            <Input label="Area / Street" placeholder="Enter Your area" value={form.area} onChangeText={(v) => updateField("area", v)} error={errors.area} />
            <Input label="Landmark (optional)" placeholder="Enter your landmark" value={form.landmark} onChangeText={(v) => updateField("landmark", v)} />
            <Input label="City" placeholder="Enter your city" value={form.city} onChangeText={(v) => updateField("city", v)} error={errors.city} />
            <Input label="State" placeholder="Enter your state" value={form.state} onChangeText={(v) => updateField("state", v)} error={errors.state} />
            <Input label="Pincode" placeholder="Enter your pincode" keyboardType="number-pad" maxLength={6} value={form.pincode} onChangeText={(v) => updateField("pincode", v)} error={errors.pincode} />

            <Checkbox checked={makeDefault} onToggle={() => setMakeDefault((prev) => !prev)} label="Set as default address" />

            {generalError ? (
              <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), marginBottom: scale(10) }}>{generalError}</Text>
            ) : null}

            <Button label={isEditMode ? "Update Address" : "Save Address"} onPress={handleSave} loading={loading} />
          </ScrollView>
        </KeyboardAvoidingView>
      </AppScreenContainer>
    </AppBackground>
  );
}