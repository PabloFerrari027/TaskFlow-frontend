"use client";

import * as React from "react";
import { useTaskActivityQuery } from "@/features/activity/hooks/use-activity";
import { ActivityTimeline } from "@/features/activity/components/activity-timeline";

export function TaskActivitySection({ taskId }: { taskId: string }) {
  const [page, setPage] = React.useState(1);
  const activityQuery = useTaskActivityQuery(taskId, page);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Histórico</h3>
      <ActivityTimeline
        query={activityQuery}
        onPageChange={setPage}
        emptyDescription="Mudanças de status, responsável, prazo e comentários desta tarefa aparecerão aqui."
      />
    </div>
  );
}
