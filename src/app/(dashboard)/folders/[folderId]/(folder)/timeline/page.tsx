"use client";

import { use } from "react";
import { FolderTimeline } from "@/features/items/components/folder-timeline";

export default function FolderTimelinePage(props: PageProps<"/folders/[folderId]/timeline">) {
  const { folderId } = use(props.params);

  return (
    <div data-page-width="full">
      <FolderTimeline folderId={folderId} />
    </div>
  );
}
