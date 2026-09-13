import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { emailLogin, getGoogleConfig, googleLogin } from "../api/auth";
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
import { saveAuthSession } from "../utils/authStorage";

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useResponsive();

  const [clientId, setClientId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [needsPhone, setNeedsPhone] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [pendingVerifier, setPendingVerifier] = useState<string | undefined>();
  const [pendingRedirectUri, setPendingRedirectUri] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    getGoogleConfig().then((cfg) => setClientId(cfg.clientId)).catch(() => {});
  }, []);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: "paasmartuserapp" });

  const validateEmailForm = () => {
    const errs: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEmailLogin = async () => {
    if (!validateEmailForm()) return;
    setGeneralError("");
    setLoading(true);
    try {
      const auth = await emailLogin({ email: email.trim().toLowerCase(), password });
      await saveAuthSession(auth);
      router.replace("/(tabs)/home" as any);
    } catch (err) {
      setGeneralError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const completeGoogleLogin = async (code: string, redirect: string, codeVerifier?: string, phoneNumber?: string) => {
    setGoogleLoading(true);
    setGeneralError("");
    try {
      const auth = await googleLogin({ code, redirectUri: redirect, codeVerifier, phone: phoneNumber, role: "CUSTOMER" });
      await saveAuthSession(auth);
      router.replace("/(tabs)/home" as any);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      if (message === "PHONE_REQUIRED") {
        setPendingCode(code);
        setPendingVerifier(codeVerifier);
        setPendingRedirectUri(redirect);
        setNeedsPhone(true);
      } else {
        setGeneralError(message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGooglePress = async () => {
    if (!clientId) return;
    setGeneralError("");
    try {
      const discovery = {
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
      };
      const request = new AuthSession.AuthRequest({
        clientId,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        scopes: ["openid", "profile", "email"],
      });
      const result = await request.promptAsync(discovery);

      if (result.type === "success" && result.params.code) {
        await completeGoogleLogin(result.params.code, redirectUri, request.codeVerifier);
      } else if (result.type !== "cancel" && result.type !== "dismiss") {
        setGeneralError("Google sign-in was not completed.");
      }
    } catch {
      setGeneralError("Google sign-in failed.");
    }
  };

  const handlePhoneSubmit = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setGeneralError("Enter a valid 10-digit mobile number");
      return;
    }
    if (pendingCode) await completeGoogleLogin(pendingCode, pendingRedirectUri, pendingVerifier, phone);
  };

  return (
    <AuthBackground>
      <ScreenContainer>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: scale(24), paddingTop: insets.top + scale(10), paddingBottom: insets.bottom + scale(20) },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.header, { marginBottom: scale(20) }]}>
              <Logo size={scale(180)} />
              <Text style={[styles.title, { fontSize: scale(typography.size.lg), marginTop: scale(10) }]}>
                {needsPhone ? "One Last Step" : "Welcome Back"}
              </Text>
              <Text style={[styles.subtitle, { fontSize: scale(typography.size.sm), marginTop: scale(4) }]}>
                {needsPhone ? "Add your phone number to continue" : "Sign in to start shopping"}
              </Text>
            </View>

            <Card style={{ ...styles.cardShadow, padding: scale(20) }}>
              {needsPhone ? (
                <>
                  <Input label="Mobile Number" placeholder="10-digit mobile number" keyboardType="phone-pad" maxLength={10} value={phone} onChangeText={setPhone} />
                  <View style={{ height: scale(8) }} />
                  {generalError ? <Text style={[styles.errorText, { fontSize: scale(typography.size.xs), marginBottom: scale(8) }]}>{generalError}</Text> : null}
                  <Button label="Continue" onPress={handlePhoneSubmit} loading={googleLoading} />
                </>
              ) : (
                <>
                  <Input
                    label="Email Address"
                    placeholder="you@example.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    error={errors.email}
                    leftElement={<Ionicons name="mail-outline" size={scale(18)} color={colors.textMuted} />}
                  />

                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    error={errors.password}
                    leftElement={<Ionicons name="lock-closed-outline" size={scale(18)} color={colors.textMuted} />}
                    rightElement={
                      <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={scale(18)} color={colors.textMuted} />
                      </Pressable>
                    }
                  />

                  <Pressable onPress={() => router.push("/(auth)/forgot-password" as any)} style={{ alignSelf: "flex-end", marginBottom: scale(14) }}>
                    <Text style={{ color: colors.primary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.medium }}>
                      Forgot Password?
                    </Text>
                  </Pressable>

                  {generalError ? (
                    <View style={[styles.errorBox, { padding: scale(10), marginBottom: scale(12) }]}>
                      <Ionicons name="alert-circle-outline" size={scale(16)} color={colors.error} />
                      <Text style={[styles.errorText, { fontSize: scale(typography.size.xs), marginLeft: scale(6), flex: 1 }]}>{generalError}</Text>
                    </View>
                  ) : null}

                  <Button label="Log In" onPress={handleEmailLogin} loading={loading} />

                  <View style={[styles.dividerRow, { marginVertical: scale(18) }]}>
                    <View style={styles.dividerLine} />
                    <Text style={[styles.dividerText, { fontSize: scale(typography.size.xs), marginHorizontal: scale(10) }]}>OR CONTINUE WITH</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Pressable
                    onPress={handleGooglePress}
                    disabled={!clientId || googleLoading}
                    style={({ pressed }) => [
                      styles.googleBtn,
                      { paddingVertical: scale(13), borderRadius: scale(14), opacity: pressed ? 0.8 : !clientId ? 0.5 : 1 },
                    ]}
                  >
                    <Ionicons name="logo-google" size={scale(18)} color={colors.textPrimary} />
                    <Text style={{ color: colors.textPrimary, fontSize: scale(typography.size.sm), fontWeight: typography.weight.bold, marginLeft: scale(8) }}>
                      {googleLoading ? "Signing in..." : "Google"}
                    </Text>
                  </Pressable>
                </>
              )}
            </Card>

            {!needsPhone && (
              <Pressable onPress={() => router.push("/(auth)/register" as any)} style={[styles.footerRow, { marginTop: scale(22) }]}>
                <Text style={{ color: colors.textSecondary, fontSize: scale(typography.size.sm) }}>
                  New here? <Text style={{ color: colors.primary, fontWeight: typography.weight.bold }}>Create an account</Text>
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
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: `${colors.error}12`, borderRadius: 10, borderWidth: 1, borderColor: `${colors.error}35` },
  errorText: { color: colors.error, textAlign: "center" },
  dividerRow: { flexDirection: "row", alignItems: "center" },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.surfaceBorder },
  dividerText: { color: colors.textMuted, fontWeight: typography.weight.bold, letterSpacing: 0.5 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  footerRow: { alignItems: "center" },
});