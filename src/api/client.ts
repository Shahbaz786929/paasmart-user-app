import { API_BASE_URL } from "./config";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  baseUrl?: string;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, baseUrl } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl ?? API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new ApiError(
      "Could not reach the server. Check that the backend is running and the API_BASE_URL is correct.",
      0
    );
  }

  const rawText = await response.text();
  let parsed: any = rawText;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    // Not JSON — leave as raw text
  }

  if (!response.ok) {
    const message =
      (parsed && (parsed.message || parsed.error)) ||
      (typeof parsed === "string" ? parsed : null) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return parsed as T;
}