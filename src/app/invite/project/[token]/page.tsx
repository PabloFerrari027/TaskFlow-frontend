"use client";

import { useParams, useRouter } from "next/navigation";
import { InvitationAcceptPage } from "@/components/shared/invitation-accept-page";
import {
  useAcceptProjectInvitationMutation,
  useProjectInvitationPreviewQuery,
} from "@/features/projects/hooks/use-projects";

export default function ProjectInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  return (
    <InvitationAcceptPage
      token={token}
      invitePath={`/invite/project/${token}`}
      entityLabel="projeto"
      previewQuery={useProjectInvitationPreviewQuery(token)}
      acceptMutation={useAcceptProjectInvitationMutation()}
      getEntityName={(preview) => preview.projectName}
      onAccepted={(preview) => router.push(`/projects/${preview.projectId}`)}
    />
  );
}
