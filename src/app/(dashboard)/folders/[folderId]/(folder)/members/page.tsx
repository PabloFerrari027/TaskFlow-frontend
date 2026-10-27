"use client";

import { use } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/shared/role-gate";
import { FolderMembersTable } from "@/features/folders/components/folder-members-table";
import { useFolderPermission } from "@/features/folders/hooks/use-folder-permission";

export default function FolderMembersPage(
  props: PageProps<"/folders/[folderId]/members">
) {
  const { folderId } = use(props.params);
  const { canManage } = useFolderPermission(folderId);

  return (
    <div className="space-y-4">
      {/* Convites live under this tab: invite and follow who accepted. */}
      <RoleGate allowed={canManage}>
        <div className="flex justify-end">
          <Button size="sm" asChild>
            <Link href={`/folders/${folderId}/invitations`}>
              <UserPlus /> Convidar pessoa
            </Link>
          </Button>
        </div>
      </RoleGate>
      <FolderMembersTable folderId={folderId} canManage={canManage} />
    </div>
  );
}
