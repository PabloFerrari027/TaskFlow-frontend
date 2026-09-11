"use client";

import { MessageSquare } from "lucide-react";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { formatRelativeTime } from "@/lib/format";
import { describeActivityEntry } from "@/features/activity/components/activity-event-label";
import type { ActivityLogEntry } from "@/types/activity";

export function ActivityFeedItem({ entry }: { entry: ActivityLogEntry }) {
  const { label, detail } = describeActivityEntry(entry);

  return (
    <li className="flex items-start gap-2.5">
      {entry.actorId ? (
        <MemberAvatar userId={entry.actorId} className="mt-0.5" />
      ) : (
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MessageSquare className="size-3.5" />
        </div>
      )}
      <div className="min-w-0 flex-1 text-sm">
        <p className="text-foreground">
          {entry.actorId ? <MemberIdLabel userId={entry.actorId} /> : "Alguém"}{" "}
          <span className="text-muted-foreground">{label}</span>
          {detail ? <span className="text-foreground"> — {detail}</span> : null}
        </p>
        <p className="text-xs text-muted-foreground">{formatRelativeTime(entry.occurredAt)}</p>
      </div>
    </li>
  );
}
