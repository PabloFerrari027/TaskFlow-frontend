"use client";

import { use } from "react";
import { FolderTrash } from "@/features/items/components/folder-trash";

export default function FolderTrashPage(props: PageProps<"/folders/[folderId]/trash">) {
  const { folderId } = use(props.params);
  return <FolderTrash folderId={folderId} />;
}
