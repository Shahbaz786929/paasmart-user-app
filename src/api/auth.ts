import { apiRequest } from "./client";

export type AuthResponse = {
  token: string;
  userId: number;
  name: string;
  role: string;
};

export type GoogleConfig = {
  clientId: string;
};

// GET /api/v1/auth/google-config
export function getGoogleConfig(): Promise<GoogleConfig> {
  return apiRequest<GoogleConfig>("/auth/google-config");
}

export type GoogleAuthPayload = {
  code: string;
  redirectUri: string;
  codeVerifier?: string;
  phone?: string;
  role: "CUSTOMER";
  tenantSlug?: string;
};

// POST /api/v1/auth/google
export function googleLogin(payload: GoogleAuthPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/google", { method: "POST", body: payload });
}

export type EmailRegisterInitPayload = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "CUSTOMER";
  tenantSlug?: string;
};

// POST /api/v1/auth/email-register — Step 1: sends OTP to email, doesn't create account yet
export function emailRegisterInit(payload: EmailRegisterInitPayload): Promise<string> {
  return apiRequest<string>("/auth/email-register", { method: "POST", body: payload });
}

export type EmailVerifyOtpPayload = {
  email: string;
  otp: string;
};

// POST /api/v1/auth/email-register-verify — Step 2: verifies OTP, creates account
export function emailRegisterVerify(payload: EmailVerifyOtpPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/email-register-verify", { method: "POST", body: payload });
}

export type EmailLoginPayload = {
  email: string;
  password: string;
};

// POST /api/v1/auth/email-login
export function emailLogin(payload: EmailLoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/email-login", { method: "POST", body: payload });
}

// POST /api/v1/auth/forgot-password
export function forgotPasswordInit(email: string): Promise<string> {
  return apiRequest<string>("/auth/forgot-password", { method: "POST", body: { email } });
}

export type ResetPasswordPayload = {
  email: string;
  otp: string;
  newPassword: string;
};

// POST /api/v1/auth/reset-password
export function resetPassword(payload: ResetPasswordPayload): Promise<string> {
  return apiRequest<string>("/auth/reset-password", { method: "POST", body: payload });
}

export function savePushToken(authToken: string, pushToken: string): Promise<string> {
  return apiRequest<string>("/auth/push-token", { method: "PUT", token: authToken, body: { pushToken } });
}