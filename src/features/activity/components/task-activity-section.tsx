"use client";

import * as React from "react";
import { useTaskActivityQuery } from "@/features/activity/hooks/use-activity";
import { ActivityFeed } from "@/features/activity/components/activity-feed";
import { useSectionsQuery } from "@/features/sections/hooks/use-sections";

export function TaskActivitySection({ taskId, projectId }: { taskId: string; projectId: string }) {
  const [page, setPage] = React.useState(1);
  const activityQuery = useTaskActivityQuery(taskId, page);
  const sectionsQuery = useSectionsQuery(projectId);

  // Stays undefined until sections load, so a move never renders "coluna removida" by mistake.
  const context = React.useMemo(
    () =>
      sectionsQuery.data
        ? { sectionNames: new Map(sectionsQuery.data.map((section) => [section.id, section.name])) }
        : undefined,
    [sectionsQuery.data]
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Histórico</h3>
      <ActivityFeed
        query={activityQuery}
        onPageChange={setPage}
        context={context}
        emptyDescription="Mudanças de título, descrição, status, responsável, prazo, coluna e comentários desta tarefa aparecerão aqui."
      />
    </div>
  );
}
