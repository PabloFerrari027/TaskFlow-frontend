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
  superseded: "Substituído pelo pedido mais novo, logo abaixo.",
};

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

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
  busy = false,
}: {
  pendingAction: PendingActionState;
  workspaceId: string;
  onStatusChange: (status: PendingActionLocalStatus) => void;
  // "Confirmar tudo" is running for this message — the buttons wait.
  busy?: boolean;
}) {
  const [reauthDialogOpen, setReauthDialogOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [reauthError, setReauthError] = React.useState<string | null>(null);

  const confirmMutation = useConfirmPendingActionMutation(workspaceId);
  const cancelMutation = useCancelPendingActionMutation();

  const isCritical = pendingAction.riskLevel === "critical";
  const isPending = pendingAction.status === "pending";
  const { expiresAt } = pendingAction;

  // The server keeps a card for 15 minutes; past that the buttons would only
  // fail, so the card shows "expirou" by itself at the right time.
  // The parent passes a fresh callback every render; the ref keeps the timer
  // from restarting on each one.
  const onStatusChangeRef = React.useRef(onStatusChange);
  React.useLayoutEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  });
  React.useEffect(() => {
    if (!isPending || !expiresAt) return;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    const expire = () => onStatusChangeRef.current("expired");
    if (remaining <= 0) {
      expire();
      return;
    }
    const timer = window.setTimeout(expire, remaining);
    return () => window.clearTimeout(timer);
  }, [isPending, expiresAt]);

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
        workspaceId={workspaceId}
        humanDescription={pendingAction.humanDescription}
        params={pendingAction.params}
        diff={pendingAction.diff}
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
            disabled={busy || confirmMutation.isPending || cancelMutation.isPending}
            onClick={handleConfirmClick}
          >
            <Check /> Confirmar
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || confirmMutation.isPending || cancelMutation.isPending}
            onClick={handleCancel}
          >
            {cancelMutation.isPending ? <Loader2 className="animate-spin" /> : <X />}
            Cancelar
          </Button>
          {expiresAt ? (
            <span className="self-center text-xs text-muted-foreground">
              Vale até as {formatClock(expiresAt)}
            </span>
          ) : null}
        </div>
      )}

      {isCritical ? (
        <ReauthDialog
          open={reauthDialogOpen}
          onClose={handleCloseReauthDialog}
          workspaceId={workspaceId}
          humanDescription={pendingAction.humanDescription}
          params={pendingAction.params}
          diff={pendingAction.diff}
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
