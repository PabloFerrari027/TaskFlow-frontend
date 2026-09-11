"use client";

import { History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Pager } from "@/components/shared/pager";
import { ActivityFeedItem } from "@/features/activity/components/activity-feed-item";
import type { PaginatedResult } from "@/types/common";
import type { ActivityLogEntry } from "@/types/activity";

interface ActivityFeedProps {
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

export function ActivityFeed({ query, onPageChange, emptyDescription }: ActivityFeedProps) {
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
        {entries.map((entry) => (
          <ActivityFeedItem key={entry.id} entry={entry} />
        ))}
      </ol>

      {query.data ? (
        <Pager meta={query.data.meta} onPageChange={onPageChange} isLoading={query.isFetching} />
      ) : null}
    </div>
  );
}
