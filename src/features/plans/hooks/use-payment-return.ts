"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

const BILLING_PATH = "/settings/billing";
const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 30_000;

interface PaymentReturnOptions<T> {
  /** Query string key Stripe's return URL carries (`checkout`, `topUp`). */
  param: string;
  toastId: string;
  cancelMessage: string;
  pendingMessage: string;
  timeoutMessage: string;
  confirmedMessage: (data: T) => string;
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  /** `first` is the first data seen after the return (the "before" picture). */
  isConfirmed: (data: T | undefined, first: T | undefined) => boolean;
  /** Runs once, when the payment is confirmed (e.g. refresh related caches). */
  onConfirmed?: (data: T) => void;
}

/**
 * Shared by every Stripe return (`?<param>=success|cancel`). Coming back is
 * not proof of payment: the server only changes when the webhook arrives, a
 * few seconds later. On success it polls `queryFn` every 2 s for up to 30 s
 * until `isConfirmed`; the toast follows the wait. The query string is
 * cleaned right away so a reload does not repeat the toast. Polling stops
 * and the toast is dismissed if the page is left first.
 */
export function usePaymentReturn<T>({
  param,
  toastId,
  cancelMessage,
  pendingMessage,
  timeoutMessage,
  confirmedMessage,
  queryKey,
  queryFn,
  isConfirmed,
  onConfirmed,
}: PaymentReturnOptions<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const result = searchParams.get(param);
  const handled = React.useRef(false);
  // Read once, on mount: the query string is removed right after.
  const [returnedFromPayment] = React.useState(() => result === "success");
  const [timedOut, setTimedOut] = React.useState(false);
  const [first, setFirst] = React.useState<T | undefined>(undefined);

  const { data } = useQuery({
    queryKey,
    queryFn,
    // Cached data from before the payment must not end the wait.
    staleTime: 0,
    refetchInterval: (query) =>
      returnedFromPayment && !timedOut && !isConfirmed(query.state.data, first)
        ? POLL_INTERVAL_MS
        : false,
  });
  // The "before" picture: set while rendering, once.
  if (first === undefined && data !== undefined) setFirst(data);
  const confirmed = isConfirmed(data, first);
  const message = confirmed && data !== undefined ? confirmedMessage(data) : null;
  const startedAt = React.useRef<number | null>(null);
  const finished = React.useRef(false);
  const confirmedHandled = React.useRef(false);
  // Latest data/callback for the effect below without making it re-run on
  // every poll (a re-run would flicker the toast).
  const latest = React.useRef({ data, onConfirmed });
  React.useEffect(() => {
    latest.current = { data, onConfirmed };
  });

  React.useEffect(() => {
    if (!result || handled.current) return;
    handled.current = true;
    if (result === "cancel") toast.info(cancelMessage);
    router.replace(BILLING_PATH, { scroll: false });
  }, [result, cancelMessage, router]);

  React.useEffect(() => {
    if (!returnedFromPayment || timedOut) return;
    if (confirmed && message !== null) {
      finished.current = true;
      toast.success(message, { id: toastId, duration: 5_000 });
      if (!confirmedHandled.current) {
        confirmedHandled.current = true;
        const { data: current, onConfirmed: callback } = latest.current;
        if (current !== undefined) callback?.(current);
      }
      return;
    }
    // Same id: calling it again just keeps the one toast.
    toast.loading(pendingMessage, { id: toastId, duration: Infinity });
    // The 30 s budget counts from the return, not from the last re-render.
    startedAt.current ??= Date.now();
    const remaining = Math.max(0, POLL_TIMEOUT_MS - (Date.now() - startedAt.current));
    const timer = window.setTimeout(() => {
      finished.current = true;
      toast.info(timeoutMessage, { id: toastId, duration: 8_000 });
      setTimedOut(true);
    }, remaining);
    return () => {
      window.clearTimeout(timer);
      // Left before confirming or timing out: nothing else would close it.
      if (!finished.current) toast.dismiss(toastId);
    };
  }, [returnedFromPayment, confirmed, timedOut, message, pendingMessage, timeoutMessage, toastId]);

  return { data, returnedFromPayment };
}
