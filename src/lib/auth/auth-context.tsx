"use client";

import * as React from "react";
import { decodeJwt } from "@/lib/auth/jwt";
import { attemptSessionRefresh } from "@/lib/api/client";
import {
  clearSession as clearSessionStore,
  getSnapshot,
  hasPersistedSession,
  hydrateFromStorage,
  subscribe,
} from "@/lib/auth/token-store";

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  signOut: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const snapshot = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  React.useEffect(() => {
    hydrateFromStorage();
    Promise.resolve()
      .then(() => (hasPersistedSession() ? attemptSessionRefresh() : null))
      .finally(() => setIsLoading(false));
  }, []);

  const payload = snapshot.accessToken ? decodeJwt(snapshot.accessToken) : null;

  const value = React.useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: Boolean(snapshot.accessToken),
      userId: payload?.sub ?? null,
      email: payload?.email ?? null,
      signOut: clearSessionStore,
    }),
    [isLoading, snapshot.accessToken, payload?.sub, payload?.email]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
