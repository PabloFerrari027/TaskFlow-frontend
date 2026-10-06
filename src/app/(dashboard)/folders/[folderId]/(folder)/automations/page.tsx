"use client";

import { use } from "react";
import { Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { FolderAutomationsSection } from "@/features/automations/components/folder-automations-section";
import { useFolderPermission } from "@/features/folders/hooks/use-folder-permission";

export default function FolderAutomationsPage(
  props: PageProps<"/folders/[folderId]/automations">
) {
  const { folderId } = use(props.params);
  // Automation endpoints are OWNER/ADMIN of the workspace — the same bar as
  // `canManage` (see canManageAutomations).
  const { folder, isLoading, canManage } = useFolderPermission(folderId);

  if (isLoading || !folder) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!canManage) {
    return (
      <EmptyState
        icon={<Lock className="size-6" />}
        title="Acesso restrito"
        description="Somente Proprietário e Administrador do workspace podem ver e gerenciar automações."
      />
    );
  }

  return <FolderAutomationsSection key={folder.id} folder={folder} />;
}
