import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshCredentials,
  setAccessToken,
} from "@/lib/auth/token-store";
import { afterResponse, beforeRequest, onRateLimited } from "@/lib/api/rate-limit";
import type { RefreshTokenResponse } from "@/types/auth";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const apiClient = axios.create({ baseURL });

// Separate instance for the refresh call itself, so it never re-enters the
// response interceptor below and can't trigger a recursive refresh loop.
const refreshClient = axios.create({ baseURL });

declare module "axios" {
  export interface AxiosRequestConfig {
    _retried?: boolean;
    _skipAuth?: boolean;
  }
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config._skipAuth) {
    const token = getAccessToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return config;
});

// Registered after the auth interceptor: axios runs request interceptors in
// reverse order, so a request waits for its slot / rate-limit cooldown first
// and only then reads the token — it can't go stale while queued.
apiClient.interceptors.request.use(beforeRequest);

let refreshPromise: Promise<string | null> | null = null;

export function redirectToLogin() {
  if (typeof window === "undefined") return;
  const next = window.location.pathname + window.location.search;
  if (!window.location.pathname.startsWith("/login")) {
    // Plain axios interceptor, outside React — no router instance available,
    // and a hard reload is wanted anyway to drop all in-memory/query state.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  }
}

// Every refresh in this tab goes through here — the interceptor, the app
// bootstrap (run twice by React StrictMode in dev) and the assistant's
// streaming fetch. The backend rotates the refresh token on each use and
// treats a second use of the same token as theft, revoking the whole session,
// so two concurrent refreshes would log the user out.
export function attemptSessionRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAcrossTabs().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Other tabs share the same refresh token (localStorage): the Web Lock makes
// them take turns, and each one reads the token only once it holds the lock —
// by then a tab that refreshed first has already stored the rotated one.
async function refreshAcrossTabs(): Promise<string | null> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("taskflow.session-refresh", performRefresh);
  }
  return performRefresh();
}

async function performRefresh(): Promise<string | null> {
  const credentials = getRefreshCredentials();
  if (!credentials) return null;

  try {
    const { data } = await refreshClient.post<RefreshTokenResponse>(
      "/auth/refresh",
      credentials
    );
    setAccessToken(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (error) {
    // A 4xx answer means the session is really gone (SESSION_EXPIRED 401,
    // SESSION_NOT_FOUND 404, revoked, logged out). A network error, 5xx, 408
    // or 429 — e.g. the API restarting in dev — keeps the stored session so
    // the next attempt can still succeed.
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status !== undefined && status >= 400 && status < 500 && status !== 408 && status !== 429) {
      clearSession();
    }
    return null;
  }
}

apiClient.interceptors.response.use(
  afterResponse,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    const rateLimitRetry = onRateLimited(error, (config) => apiClient(config));
    if (rateLimitRetry) return rateLimitRetry;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !originalRequest._skipAuth &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retried = true;

      const newAccessToken = await attemptSessionRefresh();

      if (newAccessToken) {
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return apiClient(originalRequest);
      }

      // Refresh failed without ending the session (API unreachable): keep the
      // user here and let the request fail like any other network error.
      if (getRefreshCredentials()) return Promise.reject(error);
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);
