"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const OFFLINE_HINT = "Disponível quando você estiver online.";

/**
 * Dashboard pages are online-only (nothing here goes through the sync
 * outbox). Offline, the wrapped control is rendered disabled with a tooltip
 * saying why — a disabled button fires no pointer events, so the tooltip
 * hangs off a focusable wrapper instead.
 */
export function OnlineOnly({
  isOnline,
  children,
}: {
  isOnline: boolean;
  children: React.ReactElement<{ disabled?: boolean }>;
}) {
  if (isOnline) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" tabIndex={0}>
          {React.cloneElement(children, { disabled: true })}
        </span>
      </TooltipTrigger>
      <TooltipContent>{OFFLINE_HINT}</TooltipContent>
    </Tooltip>
  );
}
