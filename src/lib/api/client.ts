import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshCredentials,
  setAccessToken,
} from "@/lib/auth/token-store";
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

let refreshPromise: Promise<string | null> | null = null;

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const next = window.location.pathname + window.location.search;
  if (!window.location.pathname.startsWith("/login")) {
    // Plain axios interceptor, outside React — no router instance available,
    // and a hard reload is wanted anyway to drop all in-memory/query state.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  }
}

export async function attemptSessionRefresh(): Promise<string | null> {
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
  } catch {
    clearSession();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !originalRequest._skipAuth &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retried = true;

      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return apiClient(originalRequest);
      }

      redirectToLogin();
    }

    return Promise.reject(error);
  }
);
