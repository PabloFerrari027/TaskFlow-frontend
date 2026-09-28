"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { ErrorState } from "@/components/shared/error-state";
import { InvitationPreviewCard } from "@/components/shared/invitation-preview-card";
import { useAuth } from "@/lib/auth/auth-context";
import { getErrorMessage } from "@/lib/errors";
import type { InvitationStatus } from "@/types/common";

interface InvitationPreviewBase {
  email: string;
  role: string;
  status: InvitationStatus;
  expiresAt: string;
}

interface InvitationAcceptPageProps<TPreview extends InvitationPreviewBase> {
  token: string;
  // Path of this invite page, used as `next` so login/register come back here.
  invitePath: string;
  entityLabel: string;
  previewQuery: UseQueryResult<TPreview>;
  acceptMutation: UseMutationResult<unknown, unknown, string>;
  getEntityName: (preview: TPreview) => string;
  onAccepted: (preview: TPreview) => void;
}

/** Shared body of the project and workspace invite pages. */
export function InvitationAcceptPage<TPreview extends InvitationPreviewBase>({
  token,
  invitePath,
  entityLabel,
  previewQuery,
  acceptMutation,
  getEntityName,
  onAccepted,
}: InvitationAcceptPageProps<TPreview>) {
  const { isAuthenticated, email } = useAuth();

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
  const entityName = getEntityName(preview);

  return (
    <InvitationPreviewCard
      entityLabel={entityLabel}
      entityName={entityName}
      email={preview.email}
      role={preview.role}
      status={preview.status}
      expiresAt={preview.expiresAt}
      isAuthenticated={isAuthenticated}
      currentEmail={email}
      loginHref={`/login?next=${encodeURIComponent(invitePath)}&email=${encodeURIComponent(preview.email)}`}
      registerHref={`/register?next=${encodeURIComponent(invitePath)}`}
      isAccepting={acceptMutation.isPending}
      onAccept={() =>
        acceptMutation.mutate(token, {
          onSuccess: () => {
            toast.success(`Você agora faz parte de ${entityName}.`);
            onAccepted(preview);
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        })
      }
    />
  );
}
