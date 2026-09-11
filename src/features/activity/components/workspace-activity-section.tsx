"use client";

import * as React from "react";
import { useWorkspaceActivityQuery } from "@/features/activity/hooks/use-activity";
import { ActivityFeed } from "@/features/activity/components/activity-feed";

export function WorkspaceActivitySection({ workspaceId }: { workspaceId: string }) {
  const [page, setPage] = React.useState(1);
  const activityQuery = useWorkspaceActivityQuery(workspaceId, page);

  return (
    <ActivityFeed
      query={activityQuery}
      onPageChange={setPage}
      emptyDescription="Mudanças em tarefas e comentários feitos neste workspace aparecerão aqui."
    />
  );
}
