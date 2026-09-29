"use client";

import * as React from "react";
import { useProjectActivityQuery } from "@/features/activity/hooks/use-activity";
import { ActivityFeed } from "@/features/activity/components/activity-feed";
import { useSectionsQuery } from "@/features/sections/hooks/use-sections";

export function ProjectActivitySection({ projectId }: { projectId: string }) {
  const [page, setPage] = React.useState(1);
  const activityQuery = useProjectActivityQuery(projectId, page);
  const sectionsQuery = useSectionsQuery(projectId);

  // Same as TaskActivitySection: undefined until sections load, so a move never renders "coluna removida" by mistake.
  const context = React.useMemo(
    () =>
      sectionsQuery.data
        ? { sectionNames: new Map(sectionsQuery.data.map((section) => [section.id, section.name])) }
        : undefined,
    [sectionsQuery.data]
  );

  return (
    <ActivityFeed
      query={activityQuery}
      onPageChange={setPage}
      context={context}
      emptyDescription="Mudanças nas tarefas, comentários, colunas e campos extras deste projeto aparecerão aqui."
    />
  );
}
