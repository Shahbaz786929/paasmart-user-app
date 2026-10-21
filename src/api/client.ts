import { API_BASE_URL } from "./config";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  token?: string | null;
  baseUrl?: string;
  timeoutMs?: number;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const DEFAULT_TIMEOUT_MS = 30000; // Render free server cold start me 20-30s lag sakte hain

// Token expire/invalid (401) hone par app logout karwane ke liye
let unauthorizedHandler: (() => void | Promise<void>) | null = null;
let handlingUnauthorized = false;

export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
  unauthorizedHandler = handler;
}

export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, baseUrl, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  let rawText: string;
  try {
    response = await fetch(`${baseUrl ?? API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    rawText = await response.text();
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new ApiError("The server is taking too long to respond. Please try again.", 0);
    }
    throw new ApiError(
      "Could not reach the server. Check your internet connection and try again.",
      0
    );
  } finally {
    clearTimeout(timer);
  }

  let parsed: any = rawText;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    // Not JSON — leave as raw text
  }

  if (!response.ok) {
    // Token ke saath 401 aaya = session khatam. Login wali request me token nahi hota, wo yahan nahi aati.
    if (response.status === 401 && token && unauthorizedHandler && !handlingUnauthorized) {
      handlingUnauthorized = true;
      Promise.resolve(unauthorizedHandler())
        .catch(() => {})
        .finally(() => setTimeout(() => (handlingUnauthorized = false), 2000));
    }

    const message =
      (parsed && (parsed.message || parsed.error)) ||
      (typeof parsed === "string" && parsed ? parsed : null) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return parsed as T;
}