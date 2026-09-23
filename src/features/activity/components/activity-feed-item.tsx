"use client";

import { MessageSquare } from "lucide-react";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { formatRelativeTime } from "@/lib/format";
import {
  describeActivityEntry,
  type ActivityDescribeContext,
} from "@/features/activity/components/activity-event-label";
import type { ActivityLogEntry } from "@/types/activity";

export function ActivityFeedItem({
  entry,
  context,
}: {
  entry: ActivityLogEntry;
  context?: ActivityDescribeContext;
}) {
  const { label, detail, assigneeChange, fieldChanges } = describeActivityEntry(entry, context);

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
          {assigneeChange ? (
            <span className="text-foreground">
              {" — "}
              {assigneeChange.from ? <MemberIdLabel userId={assigneeChange.from} /> : "sem responsável"}
              {" → "}
              {assigneeChange.to ? <MemberIdLabel userId={assigneeChange.to} /> : "sem responsável"}
            </span>
          ) : null}
        </p>
        {fieldChanges?.length ? (
          <div className="mt-1.5 space-y-1.5">
            {fieldChanges.map((change) => (
              <div key={change.field} className="rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs">
                <p className="font-medium text-muted-foreground">{change.field}</p>
                <p className="line-clamp-3 whitespace-pre-wrap break-words text-muted-foreground line-through">
                  {change.from || "vazio"}
                </p>
                <p className="line-clamp-3 whitespace-pre-wrap break-words text-foreground">
                  {change.to || "vazio"}
                </p>
              </div>
            ))}
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">{formatRelativeTime(entry.occurredAt)}</p>
      </div>
    </li>
  );
}
