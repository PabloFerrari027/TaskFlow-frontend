"use client";

import * as React from "react";
import { useFolderActivityQuery } from "@/features/activity/hooks/use-activity";
import { ActivityFeed } from "@/features/activity/components/activity-feed";
import { useSectionsQuery } from "@/features/sections/hooks/use-sections";

export function FolderActivitySection({ folderId }: { folderId: string }) {
  const [page, setPage] = React.useState(1);
  const activityQuery = useFolderActivityQuery(folderId, page);
  const sectionsQuery = useSectionsQuery(folderId);

  // Same as ItemActivitySection: undefined until sections load, so a move never renders "coluna removida" by mistake.
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
      emptyDescription="Mudanças nos itens, comentários, colunas e campos extras desta pasta aparecerão aqui."
    />
  );
}
