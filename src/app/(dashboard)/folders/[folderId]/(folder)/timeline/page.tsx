"use client";

import { use } from "react";
import { FolderTimeline } from "@/features/items/components/folder-timeline";

export default function FolderTimelinePage(props: PageProps<"/folders/[folderId]/timeline">) {
  const { folderId } = use(props.params);

  return (
    <div>
      <FolderTimeline folderId={folderId} />
    </div>
  );
}
