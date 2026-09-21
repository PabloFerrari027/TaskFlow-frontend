import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { isDomainError } from "@/types/common";

// Client-side guard against the backend's rate limiter. Instead of finding out
// about the limit from a 429, requests are queued so no more than a budget's
// worth leave in any window, mutations go ahead of background reads, and when a
// 429 still happens (other tabs/clients share the same IP) *every* request
// pauses until it clears and the rejected one is transparently replayed.

// The backend allows THROTTLE_LIMIT (300) per THROTTLE_TTL (60s) per IP. Stay
// under it to leave room for other tabs, the realtime stream and token refresh,
// none of which pass through this queue. Override with
// NEXT_PUBLIC_API_RATE_LIMIT when the server's limit changes.
const RATE_WINDOW_MS = 60_000;
const REQUESTS_PER_WINDOW = Number(process.env.NEXT_PUBLIC_API_RATE_LIMIT) || 240;
const MAX_CONCURRENT_REQUESTS = 4;

const MAX_RATE_LIMIT_RETRIES = 2;
// Anything longer than one window (e.g. a per-e-mail limit measured in
// minutes) is surfaced to the user instead of silently blocking the UI.
const MAX_AUTO_WAIT_MS = RATE_WINDOW_MS + 1_000;

declare module "axios" {
  export interface AxiosRequestConfig {
    _rateLimitRetries?: number;
    _slotHeld?: boolean;
  }
}

// Lower runs first. A write the user just made must not sit behind a page's
// worth of avatar/cover downloads.
const PRIORITY_MUTATION = 0;
const PRIORITY_READ = 1;
const PRIORITY_BINARY = 2;

function priorityOf(config: InternalAxiosRequestConfig) {
  const method = (config.method ?? "get").toLowerCase();
  if (method !== "get" && method !== "head") return PRIORITY_MUTATION;
  return config.responseType === "blob" ? PRIORITY_BINARY : PRIORITY_READ;
}

interface Waiter {
  priority: number;
  resolve: () => void;
}

let inFlight = 0;
let blockedUntil = 0;
// When each request in the current window was let through, oldest first. The
// server counts in fixed windows, so keeping every sliding 60s span under the
// budget keeps every fixed window under it too.
const sentAt: number[] = [];
const queue: Waiter[] = [];
let drainTimer: ReturnType<typeof setTimeout> | undefined;

function drain() {
  clearTimeout(drainTimer);
  drainTimer = undefined;

  while (queue.length > 0) {
    const now = Date.now();
    while (sentAt.length > 0 && now - sentAt[0] >= RATE_WINDOW_MS) sentAt.shift();

    const wait = Math.max(
      blockedUntil - now,
      sentAt.length >= REQUESTS_PER_WINDOW ? sentAt[0] + RATE_WINDOW_MS - now : 0
    );
    if (wait > 0) {
      drainTimer = setTimeout(drain, wait);
      return;
    }
    // Woken again by `releaseSlot` when a request finishes.
    if (inFlight >= MAX_CONCURRENT_REQUESTS) return;

    const next = queue.shift()!;
    inFlight++;
    sentAt.push(now);
    next.resolve();
  }
}

function acquireSlot(priority: number) {
  return new Promise<void>((resolve) => {
    // Stable insert: after everything of equal or higher priority.
    let index = queue.length;
    while (index > 0 && queue[index - 1].priority > priority) index--;
    queue.splice(index, 0, { priority, resolve });
    drain();
  });
}

function releaseSlot() {
  inFlight = Math.max(0, inFlight - 1);
  drain();
}

/** Request interceptor: waits for a free slot, budget and any active cooldown. */
export async function beforeRequest(config: InternalAxiosRequestConfig) {
  await acquireSlot(priorityOf(config));
  config._slotHeld = true;
  return config;
}

function releaseIfHeld(config: InternalAxiosRequestConfig | undefined) {
  if (config?._slotHeld) {
    config._slotHeld = false;
    releaseSlot();
  }
}

/** Response interceptor (success side): frees the slot. */
export function afterResponse(response: AxiosResponse) {
  releaseIfHeld(response.config);
  return response;
}

function parseRetryAfterMs(error: AxiosError): number | null {
  const headers = error.response?.headers;
  const raw = headers?.["retry-after"] ?? headers?.["x-ratelimit-reset"];
  if (raw == null) return null;
  const value = String(raw);

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    // `X-RateLimit-Reset` is sometimes an epoch timestamp rather than a delta.
    return seconds > 1e9 ? Math.max(0, seconds * 1000 - Date.now()) : seconds * 1000;
  }
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

// A wrong password/code attempt is throttled per route on purpose; replaying it
// behind the user's back would just burn another attempt.
function isCredentialAttempt(config: InternalAxiosRequestConfig) {
  const method = (config.method ?? "get").toLowerCase();
  return method !== "get" && !!config.url?.startsWith("/auth/");
}

/**
 * Response interceptor (error side). Frees the slot and, for a plain 429,
 * starts a global cooldown and returns the retry to run — or `null` when the
 * error should just propagate (not a 429, retries exhausted, or a domain-level
 * limit like `AI_RATE_LIMIT_EXCEEDED` that has its own user-facing message).
 */
export function onRateLimited(
  error: AxiosError,
  retry: (config: InternalAxiosRequestConfig) => Promise<unknown>
): Promise<unknown> | null {
  const config = error.config;
  releaseIfHeld(config);

  if (error.response?.status !== 429 || !config) return null;
  if (isDomainError(error.response.data)) return null;
  if (isCredentialAttempt(config)) return null;

  const attempt = config._rateLimitRetries ?? 0;
  if (attempt >= MAX_RATE_LIMIT_RETRIES) return null;

  // Cross-origin, the browser only exposes `Retry-After` when the API lists it
  // in `Access-Control-Expose-Headers`; without it all we know is that the
  // server blocks for up to a whole window, so wait that long rather than
  // retrying into the same block.
  const waitMs = parseRetryAfterMs(error) ?? RATE_WINDOW_MS;
  if (waitMs > MAX_AUTO_WAIT_MS) return null;

  config._rateLimitRetries = attempt + 1;
  blockedUntil = Math.max(blockedUntil, Date.now() + waitMs);
  // A 429 means the request was rejected before being processed, so it is
  // safe to replay regardless of method.
  const replay = retry(config);
  // Reschedule any pending wake-up around the new cooldown.
  drain();
  return replay;
}
