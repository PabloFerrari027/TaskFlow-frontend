import type { AccessTokenPayload } from "@/types/auth";

export function decodeJwt(token: string): AccessTokenPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, skewSeconds = 10): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 - skewSeconds * 1000 < Date.now();
}
