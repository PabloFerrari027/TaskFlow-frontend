"use client";

import * as React from "react";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

// No endpoint exposes the user's actual plan/token cap or a real quota reset
// time — `GET /auth/me` never returns a planId, so there's no number to treat
// as "100%" (see plan-picker.tsx). This meter shows today's real usage from
// `/ai-usage/me` on a bar that scales itself to a round number just above the
// current value (like an auto-ranging chart axis), and counts down to local
// midnight — the one reset boundary that *is* real, since `/ai-usage/me?days=1`
// always windows from the start of the local day.
const NICE_SCALE_STEPS = [
  500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000,
];

function niceScaleFor(value: number): number {
  const withHeadroom = value * 1.15;
  return NICE_SCALE_STEPS.find((step) => step >= withHeadroom) ?? withHeadroom;
}

function msUntilNextLocalMidnight(from: Date): number {
  const next = new Date(from);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - from.getTime();
}

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  return `${hours}h${minutes.toString().padStart(2, "0")}`;
}

export function AssistantUsageMeter({
  tokensToday,
  isUpdating,
}: {
  tokensToday: number | null;
  isUpdating: boolean;
}) {
  const [now, setNow] = React.useState<Date>(() => new Date());

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (tokensToday === null) {
    return <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" aria-hidden />;
  }

  const scale = niceScaleFor(tokensToday);
  const percent = Math.min(100, (tokensToday / scale) * 100);
  const countdown = formatCountdown(msUntilNextLocalMidnight(now));

  return (
    <div className="space-y-1">
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Uso de IA hoje"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-[width] duration-500 ease-out",
            isUpdating && "animate-pulse"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Coins className="size-3" />
          Uso de IA hoje
        </span>
        <span>reinicia em {countdown}</span>
      </div>
    </div>
  );
}
