"use client";

import { History, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Pager } from "@/components/shared/pager";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { formatRelativeTime } from "@/lib/format";
import { describeActivityEntry } from "@/features/activity/lib/describe-entry";
import type { PaginatedResult } from "@/types/common";
import type { ActivityLogEntry } from "@/types/activity";

interface ActivityTimelineProps {
  query: {
    data?: PaginatedResult<ActivityLogEntry>;
    isLoading: boolean;
    isError: boolean;
    isFetching: boolean;
    error: unknown;
    refetch: () => void;
  };
  onPageChange: (page: number) => void;
  emptyDescription: string;
}

export function ActivityTimeline({ query, onPageChange, emptyDescription }: ActivityTimelineProps) {
  if (query.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }

  const entries = query.data?.data ?? [];

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<History className="size-5" />}
        title="Nenhuma atividade ainda"
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {entries.map((entry) => {
          const { label, detail } = describeActivityEntry(entry);
          return (
            <li key={entry.id} className="flex items-start gap-2.5">
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
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(entry.occurredAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {query.data ? (
        <Pager meta={query.data.meta} onPageChange={onPageChange} isLoading={query.isFetching} />
      ) : null}
    </div>
  );
}
