// Single place for talking to the admin backend: base URL, auth token and 401 handling.
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const TOKEN_KEY = "authToken";
export const AUTH_EXPIRED_EVENT = "auth:expired";

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable (private mode); session lasts until reload
  }
};

// Drop-in replacement for fetch(`${VITE_API_URL}${path}`) that sends the login token.
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  // Token expired / invalid on a protected route -> AuthContext logs the user out
  if (response.status === 401 && token && !path.startsWith("/api/auth/login")) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
  return response;
}

// JSON helper for endpoints that return { ok, data, error }
export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    throw new Error(body.error || body.message || `Request failed (${response.status})`);
  }
  return body.data as T;
}
