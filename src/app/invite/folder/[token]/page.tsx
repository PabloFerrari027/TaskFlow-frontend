"use client";

import { useParams, useRouter } from "next/navigation";
import { InvitationAcceptPage } from "@/components/shared/invitation-accept-page";
import {
  useAcceptFolderInvitationMutation,
  useFolderInvitationPreviewQuery,
} from "@/features/folders/hooks/use-folders";

export default function FolderInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  return (
    <InvitationAcceptPage
      token={token}
      invitePath={`/invite/folder/${token}`}
      entityLabel="pasta"
      previewQuery={useFolderInvitationPreviewQuery(token)}
      acceptMutation={useAcceptFolderInvitationMutation()}
      getEntityName={(preview) => preview.folderName}
      onAccepted={(preview) => router.push(`/folders/${preview.folderId}`)}
    />
  );
}
