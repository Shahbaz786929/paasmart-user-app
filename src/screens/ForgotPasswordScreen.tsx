import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { forgotPasswordInit, resetPassword } from "../api/auth";
import { ApiError } from "../api/client";
import { AuthBackground } from "../components/AuthBackground";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Logo } from "../components/Logo";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useResponsive } from "../theme/useResponsive";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [step, setStep] = useState<"email" | "reset">("email");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetErrors, setResetErrors] = useState<{ otp?: string; newPassword?: string; confirmPassword?: string }>({});

  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError("");
    setGeneralError("");
    setLoading(true);
    try {
      await forgotPasswordInit(email.trim().toLowerCase());
      setStep("reset");
    } catch (err) {
      setGeneralError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateReset = () => {
    const errs: typeof resetErrors = {};
    if (!/^\d{6}$/.test(otp)) errs.otp = "Enter the 6-digit code sent to your email";
    if (newPassword.length < 6) errs.newPassword = "Password must be at least 6 characters";
    if (confirmPassword !== newPassword) errs.confirmPassword = "Passwords do not match";
    setResetErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateReset()) return;
    setGeneralError("");
    setLoading(true);
    try {
      await resetPassword({ email: email.trim().toLowerCase(), otp, newPassword });
      setSuccess(true);
      setTimeout(() => {
        router.replace("/(auth)/login" as any);
      }, 1500);
    } catch (err) {
      setGeneralError(err instanceof ApiError ? err.message : "Could not reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setGeneralError("");
    try {
      await forgotPasswordInit(email.trim().toLowerCase());
    } catch (err) {
      setGeneralError(err instanceof ApiError ? err.message : "Could not resend code.");
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
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: scale(24), paddingTop: insets.top + scale(10), paddingBottom: insets.bottom + scale(20) },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.header, { marginBottom: scale(20) }]}>
              <Logo size={scale(120)} />
              <Text style={[styles.title, { fontSize: scale(typography.size.lg), marginTop: scale(4) }]}>
                {step === "email" ? "Reset Password" : "Enter New Password"}
              </Text>
              <Text style={[styles.subtitle, { fontSize: scale(typography.size.sm), marginTop: scale(4) }]}>
                {step === "email"
                  ? "Enter the email linked to your account"
                  : `Enter the code sent to ${email}`}
              </Text>
            </View>

            <Card style={{ padding: scale(20) }}>
              {success ? (
                <View style={{ alignItems: "center", paddingVertical: scale(10) }}>
                  <Ionicons name="checkmark-circle" size={scale(48)} color={colors.primary} />
                  <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginTop: scale(12), textAlign: "center" }}>
                    Password reset successfully
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: scale(typography.size.xs), marginTop: scale(4), textAlign: "center" }}>
                    Redirecting to login...
                  </Text>
                </View>
              ) : step === "email" ? (
                <>
                  <Input
                    label="Email Address"
                    placeholder="you@example.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    error={emailError}
                    leftElement={<Ionicons name="mail-outline" size={scale(18)} color={colors.textMuted} />}
                  />

                  {generalError ? (
                    <Text style={[styles.errorText, { fontSize: scale(typography.size.xs), marginBottom: scale(10) }]}>{generalError}</Text>
                  ) : null}

                  <Button label={loading ? "Sending..." : "Send Reset Code"} onPress={handleSendCode} loading={loading} />
                </>
              ) : (
                <>
                  <Input
                    label="Verification Code"
                    placeholder="6-digit code"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                    error={resetErrors.otp}
                  />

                  <Input
                    label="New Password"
                    placeholder="At least 6 characters"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    error={resetErrors.newPassword}
                    rightElement={
                      <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={scale(18)} color={colors.textMuted} />
                      </Pressable>
                    }
                  />

                  <Input
                    label="Confirm New Password"
                    placeholder="Re-enter new password"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    error={resetErrors.confirmPassword}
                  />

                  {generalError ? (
                    <Text style={[styles.errorText, { fontSize: scale(typography.size.xs), marginBottom: scale(10) }]}>{generalError}</Text>
                  ) : null}

                  <Button label={loading ? "Resetting..." : "Reset Password"} onPress={handleResetPassword} loading={loading} />

                  <View style={{ height: scale(10) }} />
                  <Pressable onPress={handleResendCode} disabled={loading}>
                    <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.medium, textAlign: "center" }}>
                      Resend Code
                    </Text>
                  </Pressable>
                </>
              )}
            </Card>

            {!success && (
              <Pressable onPress={() => router.replace("/(auth)/login" as any)} style={[styles.footerRow, { marginTop: scale(18) }]}>
                <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm) }}>
                  Remember your password? <Text style={{ color: colors.primary, fontWeight: typography.weight.bold }}>Log In</Text>
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
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  header: { alignItems: "center" },
  title: { color: colors.textPrimary, fontWeight: typography.weight.heavy },
  subtitle: { color: colors.textSecondary, textAlign: "center" },
  errorText: { color: colors.error, textAlign: "center" },
  footerRow: { alignItems: "center" },
});