"use client";

import Link from "next/link";
import { Square, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/format";
import { useItemQuery } from "@/features/items/hooks/use-items";
import {
  useElapsedSeconds,
  useRunningTimerQuery,
  useStopTimerMutation,
} from "@/features/time-tracking/hooks/use-time-tracking";
import type { TimeEntry } from "@/types/time-tracking";

function RunningPill({ entry }: { entry: TimeEntry }) {
  const elapsed = useElapsedSeconds(entry);
  const itemQuery = useItemQuery(entry.itemId);
  const stopMutation = useStopTimerMutation();
  const title = itemQuery.data?.title ?? "Item";

  return (
    <div className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 py-0.5 pr-0.5 pl-2.5 text-sm">
      <Timer className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
      <Link
        href={`/folders/${entry.folderId}/items?itemId=${entry.itemId}`}
        className="flex items-center gap-1.5 hover:underline"
        title={`Cronômetro rodando em “${title}”`}
      >
        <span className="font-mono tabular-nums">{formatClock(elapsed)}</span>
        <span className="hidden max-w-32 truncate text-muted-foreground lg:inline">{title}</span>
      </Link>
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-full"
        aria-label="Parar cronômetro"
        title="Parar e salvar o tempo"
        disabled={stopMutation.isPending}
        onClick={() => stopMutation.mutate()}
      >
        <Square className="fill-current" />
      </Button>
    </div>
  );
}

/** Shown in the topbar only while the user's timer is running. */
export function RunningTimerIndicator() {
  const runningQuery = useRunningTimerQuery();
  const entry = runningQuery.data;
  if (!entry) return null;
  return <RunningPill entry={entry} />;
}
