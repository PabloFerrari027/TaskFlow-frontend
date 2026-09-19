"use client";

import * as React from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getErrorCode } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  useCancelPendingActionMutation,
  useConfirmPendingActionMutation,
} from "@/features/assistant/hooks/use-assistant";
import { PendingActionDetails } from "@/features/assistant/components/pending-action-details";
import { ReauthDialog } from "@/features/assistant/components/reauth-dialog";
import type { PendingActionLocalStatus, PendingActionState } from "@/features/assistant/types";

const STATUS_LABEL: Record<Exclude<PendingActionLocalStatus, "pending">, string> = {
  confirmed: "✅ Confirmado",
  cancelled: "Cancelado",
  expired: "Essa ação expirou — peça de novo pelo chat.",
};

/**
 * The most sensitive piece of the assistant: confirming is ALWAYS a click on
 * a "Confirmar" button, never something inferred from a chat message.
 * `standard` actions confirm directly; `critical` actions open `ReauthDialog`
 * (a blocking modal, not an inline step — see that file) instead. `params`
 * is always rendered alongside `humanDescription`, never hidden: the
 * backend's own documented mitigation for `reply` being persuasive-but-not-
 * authoritative text (API.md § 16).
 */
export function PendingActionCard({
  pendingAction,
  workspaceId,
  onStatusChange,
}: {
  pendingAction: PendingActionState;
  workspaceId: string;
  onStatusChange: (status: PendingActionLocalStatus) => void;
}) {
  const [reauthDialogOpen, setReauthDialogOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [reauthError, setReauthError] = React.useState<string | null>(null);

  const confirmMutation = useConfirmPendingActionMutation(workspaceId);
  const cancelMutation = useCancelPendingActionMutation();

  const isCritical = pendingAction.riskLevel === "critical";

  function doConfirm(reauth?: { password: string } | { googleIdToken: string }) {
    setReauthError(null);
    confirmMutation.mutate(
      {
        actionId: pendingAction.id,
        tool: pendingAction.tool,
        isCurrentSession: pendingAction.isCurrentSession,
        reauth,
      },
      {
        onSuccess: () => {
          setReauthDialogOpen(false);
          onStatusChange("confirmed");
        },
        onError: (error) => {
          const code = getErrorCode(error);
          if (code === "PENDING_ACTION_EXPIRED" || code === "PENDING_ACTION_NOT_FOUND") {
            setReauthDialogOpen(false);
            onStatusChange("expired");
            return;
          }
          if (code === "REAUTHENTICATION_REQUIRED") {
            setReauthError("Não foi possível confirmar sua identidade. Tente novamente.");
            setPassword("");
          }
        },
      }
    );
  }

  function handleConfirmClick() {
    if (isCritical) {
      setReauthDialogOpen(true);
      return;
    }
    doConfirm();
  }

  // Closing the modal (its own "Cancelar") only backs out of the
  // reauthentication step — the PendingAction itself stays pending and can
  // be resumed later; only the card's own "Cancelar" below cancels it.
  function handleCloseReauthDialog() {
    setReauthDialogOpen(false);
    setPassword("");
    setReauthError(null);
  }

  function handleCancel() {
    cancelMutation.mutate(pendingAction.id, {
      onSuccess: () => onStatusChange("cancelled"),
      onError: (error) => {
        const code = getErrorCode(error);
        if (code === "PENDING_ACTION_EXPIRED" || code === "PENDING_ACTION_NOT_FOUND") {
          onStatusChange("expired");
        }
      },
    });
  }

  return (
    <Card className={cn("space-y-3 p-3", isCritical && "border-destructive/40")}>
      <PendingActionDetails
        humanDescription={pendingAction.humanDescription}
        params={pendingAction.params}
        isCurrentSession={pendingAction.isCurrentSession}
      />

      {pendingAction.status !== "pending" ? (
        <p className="text-xs font-medium text-muted-foreground">
          {STATUS_LABEL[pendingAction.status]}
        </p>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isCritical ? "destructive" : "default"}
            disabled={confirmMutation.isPending || cancelMutation.isPending}
            onClick={handleConfirmClick}
          >
            <Check /> Confirmar
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={confirmMutation.isPending || cancelMutation.isPending}
            onClick={handleCancel}
          >
            {cancelMutation.isPending ? <Loader2 className="animate-spin" /> : <X />}
            Cancelar
          </Button>
        </div>
      )}

      {isCritical ? (
        <ReauthDialog
          open={reauthDialogOpen}
          onClose={handleCloseReauthDialog}
          humanDescription={pendingAction.humanDescription}
          params={pendingAction.params}
          isCurrentSession={pendingAction.isCurrentSession}
          password={password}
          onPasswordChange={setPassword}
          error={reauthError}
          isPending={confirmMutation.isPending}
          onConfirm={() => doConfirm({ password })}
          onConfirmWithGoogle={(googleIdToken) => doConfirm({ googleIdToken })}
        />
      ) : null}
    </Card>
  );
}
