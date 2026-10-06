"use client";

import { use } from "react";
import { FolderStatsSection } from "@/features/folder-stats/components/folder-stats-section";
import { FolderTimeReport } from "@/features/time-tracking/components/folder-time-report";

export default function FolderStatsPage(props: PageProps<"/folders/[folderId]/stats">) {
  const { folderId } = use(props.params);

  return (
    <div className="space-y-6">
      <FolderStatsSection key={folderId} folderId={folderId} />
      <FolderTimeReport folderId={folderId} />
    </div>
  );
}
