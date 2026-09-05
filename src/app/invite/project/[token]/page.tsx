"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { InvitationPreviewCard } from "@/components/shared/invitation-preview-card";
import { useAuth } from "@/lib/auth/auth-context";
import { getErrorMessage } from "@/lib/errors";
import {
  useAcceptProjectInvitationMutation,
  useProjectInvitationPreviewQuery,
} from "@/features/projects/hooks/use-projects";

export default function ProjectInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated, email } = useAuth();
  const previewQuery = useProjectInvitationPreviewQuery(token);
  const acceptMutation = useAcceptProjectInvitationMutation();

  if (previewQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (previewQuery.isError || !previewQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <ErrorState
          error={previewQuery.error}
          title="Convite não encontrado"
          onRetry={() => previewQuery.refetch()}
        />
      </div>
    );
  }

  const preview = previewQuery.data;
  const next = `/invite/project/${token}`;

  return (
    <InvitationPreviewCard
      entityLabel="projeto"
      entityName={preview.projectName}
      email={preview.email}
      role={preview.role}
      status={preview.status}
      expiresAt={preview.expiresAt}
      isAuthenticated={isAuthenticated}
      currentEmail={email}
      loginHref={`/login?next=${encodeURIComponent(next)}&email=${encodeURIComponent(preview.email)}`}
      registerHref={`/register?next=${encodeURIComponent(next)}`}
      isAccepting={acceptMutation.isPending}
      onAccept={() =>
        acceptMutation.mutate(token, {
          onSuccess: () => {
            toast.success(`Você agora faz parte de ${preview.projectName}.`);
            router.push(`/projects/${preview.projectId}`);
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        })
      }
    />
  );
}
