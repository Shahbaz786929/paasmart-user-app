import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "../api/client";
import { getMyProfile, updateMyProfile, updateProfilePhoto } from "../api/profile";
import { AppBackground } from "../components/AppBackground";
import { AppScreenContainer } from "../components/AppScreenContainer";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { useSafeBack } from "../hooks/useSafeBack";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { getAuthToken, updateStoredUserName } from "../utils/authStorage";

export function EditProfileScreen() {
  const router = useRouter();
  const goBack = useSafeBack();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [loadingExisting, setLoadingExisting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [generalError, setGeneralError] = useState("");

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoadingExisting(true);
        try {
          const token = await getAuthToken();
          if (!token) return;
          const profile = await getMyProfile(token);
          setName(profile.name || "");
          setEmail(profile.email || "");
          setPhone(profile.phone || "");
          setProfileImage(profile.profileImage);
          setGeneralError("");
        } catch (err) {
          setGeneralError(err instanceof ApiError ? err.message : "Could not load your profile.");
        } finally {
          setLoadingExisting(false);
        }
      };
      load();
    }, [])
  );

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setGeneralError("Permission to access photos is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploadingPhoto(true);
    setGeneralError("");
    try {
      const token = await getAuthToken();
      if (!token) return;
      const updated = await updateProfilePhoto(token, result.assets[0].uri);
      setProfileImage(updated.profileImage);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Could not update profile photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validate = () => {
    const nextErrors: { name?: string; email?: string } = {};
    if (!name.trim() || name.trim().length < 2) {
      nextErrors.name = "Please enter your full name";
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setGeneralError("");
    try {
      const token = await getAuthToken();
      if (!token) return;
      const updated = await updateMyProfile(token, {
        name: name.trim(),
        email: email.trim() || null,
      });
      await updateStoredUserName(updated.name);
      setSaved(true);
      setTimeout(() => goBack(), 800);
    } catch (err) {
      setGeneralError(err instanceof ApiError ? err.message : "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppBackground>
      <AppScreenContainer>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1, paddingTop: insets.top + scale(16) }}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: scale(20), marginBottom: scale(20) }}>
              <Pressable onPress={goBack} style={{ marginRight: scale(10) }}>
                <Ionicons name="arrow-back" size={scale(22)} color={colors.textPrimary} />
              </Pressable>
              <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.lg), fontWeight: typography.weight.heavy }}>
                Edit Profile
              </Text>
            </View>

            {loadingExisting ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: scale(30) }} />
            ) : (
              <View style={{ paddingHorizontal: scale(20) }}>
                {/* Profile photo */}
                <View style={{ alignItems: "center", marginBottom: scale(20) }}>
                  <Pressable onPress={handlePickPhoto} disabled={uploadingPhoto}>
                    <View
                      style={{
                        width: scale(96),
                        height: scale(96),
                        borderRadius: scale(48),
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.surfaceBorder,
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      {uploadingPhoto ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : profileImage ? (
                        <Image source={{ uri: profileImage }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      ) : (
                        <Ionicons name="person" size={scale(40)} color={colors.primary} />
                      )}
                    </View>
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: scale(30),
                        height: scale(30),
                        borderRadius: scale(15),
                        backgroundColor: colors.primary,
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: 2,
                        borderColor: colors.background,
                      }}
                    >
                      <Ionicons name="camera" size={scale(15)} color={colors.white} />
                    </View>
                  </Pressable>
                  <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(8) }}>
                    Tap to change photo
                  </Text>
                </View>

                <Card>
                  <Input
                    label="Full Name"
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                    error={errors.name}
                    autoCapitalize="words"
                  />
                  <Input
                    label="Email (optional)"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    error={errors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Input label="Mobile Number" value={phone} editable={false} style={{ opacity: 0.5 }} />
                  <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: -scale(6) }}>
                    Mobile number can't be changed here
                  </Text>
                </Card>

                {generalError ? (
                  <Text style={{ color: colors.error, fontSize: scale(typography.size.sm), marginTop: scale(12) }}>{generalError}</Text>
                ) : null}

                {saved ? (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: scale(16) }}>
                    <Ionicons name="checkmark-circle" size={scale(20)} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), marginLeft: scale(8), fontWeight: typography.weight.medium }}>
                      Profile updated!
                    </Text>
                  </View>
                ) : (
                  <View style={{ marginTop: scale(16) }}>
                    <Button label="Save Changes" onPress={handleSave} loading={saving} />
                  </View>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </AppScreenContainer>
    </AppBackground>
  );
}