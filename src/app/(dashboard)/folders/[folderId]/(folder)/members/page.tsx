"use client";

import { use } from "react";
import { FolderMembersTable } from "@/features/folders/components/folder-members-table";
import { useFolderPermission } from "@/features/folders/hooks/use-folder-permission";

export default function FolderMembersPage(
  props: PageProps<"/folders/[folderId]/members">
) {
  const { folderId } = use(props.params);
  const { canManage } = useFolderPermission(folderId);

  return <FolderMembersTable folderId={folderId} canManage={canManage} />;
}
