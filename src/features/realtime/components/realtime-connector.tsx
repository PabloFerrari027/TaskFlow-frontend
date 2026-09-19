"use client";

import { useRealtimeConnection } from "@/features/realtime/hooks/use-realtime-connection";

/** Mounts the realtime connection once inside the authenticated tree (the
 * dashboard layout is a Server Component, so it can't call the hook itself).
 * Renders nothing. */
export function RealtimeConnector() {
  useRealtimeConnection();
  return null;
}
