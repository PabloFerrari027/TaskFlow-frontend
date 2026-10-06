"use client";

import { use } from "react";
import { CustomFieldsList } from "@/features/custom-fields/components/custom-fields-list";
import { useFolderPermission } from "@/features/folders/hooks/use-folder-permission";

export default function FolderCustomFieldsPage(
  props: PageProps<"/folders/[folderId]/custom-fields">
) {
  const { folderId } = use(props.params);
  const { canManage } = useFolderPermission(folderId);

  return <CustomFieldsList folderId={folderId} canManage={canManage} />;
}
