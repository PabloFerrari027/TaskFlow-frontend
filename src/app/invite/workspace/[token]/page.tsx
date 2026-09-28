"use client";

import { useParams, useRouter } from "next/navigation";
import { InvitationAcceptPage } from "@/components/shared/invitation-accept-page";
import {
  useAcceptWorkspaceInvitationMutation,
  useWorkspaceInvitationPreviewQuery,
} from "@/features/workspaces/hooks/use-workspaces";

export default function WorkspaceInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  return (
    <InvitationAcceptPage
      token={token}
      invitePath={`/invite/workspace/${token}`}
      entityLabel="workspace"
      previewQuery={useWorkspaceInvitationPreviewQuery(token)}
      acceptMutation={useAcceptWorkspaceInvitationMutation()}
      getEntityName={(preview) => preview.workspaceName}
      onAccepted={() => router.push("/projects")}
    />
  );
}
