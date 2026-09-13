import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { emailRegisterInit, emailRegisterVerify } from "../api/auth";
import { ApiError } from "../api/client";
import { AuthBackground } from "../components/AuthBackground";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Checkbox } from "../components/Checkbox";
import { Input } from "../components/Input";
import { Logo } from "../components/Logo";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";
import { saveAuthSession } from "../utils/authStorage";

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const EMPTY_FORM: FormState = { name: "", email: "", phone: "", password: "", confirmPassword: "" };

export function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email address";
    if (!/^[6-9]\d{9}$/.test(form.phone)) errs.phone = "Enter a valid 10-digit mobile number";
    if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (form.confirmPassword !== form.password) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendOtp = async () => {
    if (!agreedToTerms) {
      setGeneralError("Please accept the Terms & Conditions to continue");
      return;
    }
    if (!validate()) return;

    setGeneralError("");
    setLoading(true);
    try {
      await emailRegisterInit({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone,
        role: "CUSTOMER",
      });
      setStep("otp");
    } catch (err) {
      setGeneralError(err instanceof ApiError ? err.message : "Unable to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6-digit code sent to your email");
      return;
    }
    setOtpError("");
    setLoading(true);
    try {
      const auth = await emailRegisterVerify({ email: form.email.trim().toLowerCase(), otp });
      await saveAuthSession(auth);
      router.replace("/(tabs)/home" as any);
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setOtpError("");
    try {
      await emailRegisterInit({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone,
        role: "CUSTOMER",
      });
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : "Could not resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
      <ScreenContainer>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: scale(20),
              paddingTop: insets.top + scale(16),
              paddingBottom: insets.bottom + scale(24),
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.header, { marginBottom: scale(12) }]}>
              <Logo size={scale(140)} />
              <Text style={[styles.title, { fontSize: scale(typography.size.lg), marginTop: scale(-8) }]}>
                {step === "form" ? "Create Your Account" : "Verify Your Email"}
              </Text>
              <Text style={[styles.subtitle, { fontSize: scale(typography.size.sm), marginTop: scale(2) }]}>
                {step === "form"
                  ? "Sign up to start shopping on PaasMart"
                  : `Enter the 6-digit code sent to ${form.email}`}
              </Text>
            </View>

            {step === "form" ? (
              <Card>
                <Input label="Full Name" placeholder="Your name" value={form.name} onChangeText={(v) => setField("name", v)} error={errors.name} />
                <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(v) => setField("email", v)} error={errors.email} />
                <Input label="Mobile Number" placeholder="10-digit mobile number" keyboardType="phone-pad" maxLength={10} value={form.phone} onChangeText={(v) => setField("phone", v)} error={errors.phone} />
                <Input
                  label="Password"
                  placeholder="At least 6 characters"
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(v) => setField("password", v)}
                  error={errors.password}
                  rightElement={
                    <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                      <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.xs) }}>
                        {showPassword ? "HIDE" : "SHOW"}
                      </Text>
                    </Pressable>
                  }
                />
                <Input label="Confirm Password" placeholder="Re-enter your password" secureTextEntry={!showPassword} value={form.confirmPassword} onChangeText={(v) => setField("confirmPassword", v)} error={errors.confirmPassword} />

                <View style={{ height: scale(4) }} />
                <Checkbox checked={agreedToTerms} onToggle={() => setAgreedToTerms((v) => !v)} label="I agree to the Terms & Conditions and Privacy Policy" />

                {generalError ? (
                  <Text style={[styles.errorText, { fontSize: scale(typography.size.xs), marginBottom: scale(10) }]}>{generalError}</Text>
                ) : null}

                <Button label="Send Verification Code" onPress={handleSendOtp} loading={loading} />
              </Card>
            ) : (
              <Card>
                <Input
                  label="Verification Code"
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  error={otpError}
                />

                <Button label="Verify & Create Account" onPress={handleVerifyOtp} loading={loading} />

                <View style={{ height: scale(10) }} />
                <Pressable onPress={handleResendOtp} disabled={loading}>
                  <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.medium, textAlign: "center" }}>
                    Resend Code
                  </Text>
                </Pressable>

                <Pressable onPress={() => setStep("form")} style={{ marginTop: scale(8) }}>
                  <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), textAlign: "center" }}>
                    Edit details
                  </Text>
                </Pressable>
              </Card>
            )}

            {step === "form" && (
              <Pressable onPress={() => router.replace("/(auth)/login" as any)} style={[styles.footerRow, { marginTop: scale(18) }]}>
                <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm) }}>
                  Already have an account? <Text style={{ color: colors.primary, fontWeight: typography.weight.bold }}>Log In</Text>
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { alignItems: "center" },
  title: { color: colors.textPrimary, fontWeight: typography.weight.heavy },
  subtitle: { color: colors.textSecondary, textAlign: "center" },
  errorText: { color: colors.error, textAlign: "center" },
  footerRow: { alignItems: "center" },
});