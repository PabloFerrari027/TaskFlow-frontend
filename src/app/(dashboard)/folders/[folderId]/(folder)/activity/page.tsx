"use client";

import { use } from "react";
import { FolderActivitySection } from "@/features/activity/components/folder-activity-section";

export default function FolderActivityPage(props: PageProps<"/folders/[folderId]/activity">) {
  const { folderId } = use(props.params);

  return <FolderActivitySection key={folderId} folderId={folderId} />;
}
