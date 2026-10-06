"use client";

import { use, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/shared/role-gate";
import { FolderInvitationsTable } from "@/features/folders/components/folder-invitations-table";
import { InviteFolderMemberDialog } from "@/features/folders/components/invite-folder-member-dialog";
import { useFolderPermission } from "@/features/folders/hooks/use-folder-permission";

export default function FolderInvitationsPage(
  props: PageProps<"/folders/[folderId]/invitations">
) {
  const { folderId } = use(props.params);
  const { canManage } = useFolderPermission(folderId);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="space-y-4">
      <RoleGate allowed={canManage}>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus /> Convidar pessoa
          </Button>
        </div>
      </RoleGate>
      <FolderInvitationsTable
        folderId={folderId}
        canManage={canManage}
        onInvite={() => setInviteOpen(true)}
      />
      <InviteFolderMemberDialog
        folderId={folderId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </div>
  );
}
