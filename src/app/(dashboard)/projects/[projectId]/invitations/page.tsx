"use client";

import { use, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/shared/role-gate";
import { ProjectInvitationsTable } from "@/features/projects/components/project-invitations-table";
import { InviteProjectMemberDialog } from "@/features/projects/components/invite-project-member-dialog";
import { useProjectPermission } from "@/features/projects/hooks/use-project-permission";

export default function ProjectInvitationsPage(
  props: PageProps<"/projects/[projectId]/invitations">
) {
  const { projectId } = use(props.params);
  const { canManage } = useProjectPermission(projectId);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="space-y-4">
      <RoleGate allowed={canManage}>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus /> Convidar
          </Button>
        </div>
      </RoleGate>
      <ProjectInvitationsTable projectId={projectId} canManage={canManage} />
      <InviteProjectMemberDialog
        projectId={projectId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </div>
  );
}
