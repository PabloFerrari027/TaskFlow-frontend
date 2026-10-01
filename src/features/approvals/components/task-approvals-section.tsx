"use client";

import * as React from "react";
import { BadgeCheck, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { AssigneeSelect } from "@/features/tasks/components/assignee-select";
import { useMemberName } from "@/features/tasks/components/task-assignees-field";
import { ApprovalDecisionButtons } from "@/features/approvals/components/approval-decision-buttons";
import {
  useCancelApprovalMutation,
  useRequestApprovalMutation,
  useTaskApprovalsQuery,
} from "@/features/approvals/hooks/use-approvals";
import type { TaskApprovalStatus } from "@/types/approval";

export const APPROVAL_STATUS: Record<TaskApprovalStatus, { label: string; className: string }> = {
  PENDING: { label: "Aguardando", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  APPROVED: { label: "Aprovada", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  REJECTED: { label: "Recusada", className: "bg-destructive/10 text-destructive" },
  CANCELLED: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
};

function RequestForm({ projectId, taskId, onDone }: { projectId: string; taskId: string; onDone: () => void }) {
  const requestMutation = useRequestApprovalMutation(taskId);
  const [approverId, setApproverId] = React.useState<string | undefined>();
  const [note, setNote] = React.useState("");

  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <p className="text-xs text-muted-foreground">Quem precisa aprovar?</p>
      <AssigneeSelect projectId={projectId} value={approverId} onChange={setApproverId} />
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={2000}
        placeholder="Recado para quem vai aprovar (opcional)"
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button
          size="sm"
          disabled={!approverId || requestMutation.isPending}
          onClick={() =>
            approverId &&
            requestMutation.mutate({ approverId, note: note.trim() || undefined }, { onSuccess: onDone })
          }
        >
          <Send /> Pedir
        </Button>
      </div>
    </div>
  );
}

/** Ask someone to sign off on a task, and see/answer the requests. */
export function TaskApprovalsSection({ projectId, taskId }: { projectId: string; taskId: string }) {
  const { userId } = useAuth();
  const memberName = useMemberName(projectId);
  const approvalsQuery = useTaskApprovalsQuery(taskId);
  const cancelMutation = useCancelApprovalMutation();
  const [requesting, setRequesting] = React.useState(false);
  const approvals = approvalsQuery.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BadgeCheck className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Aprovações</h3>
        </div>
        {!requesting ? (
          <Button size="sm" variant="outline" onClick={() => setRequesting(true)}>
            Pedir aprovação
          </Button>
        ) : null}
      </div>

      {requesting ? (
        <RequestForm projectId={projectId} taskId={taskId} onDone={() => setRequesting(false)} />
      ) : null}

      {approvalsQuery.isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : approvals.length === 0 ? (
        !requesting ? (
          <p className="text-sm text-muted-foreground">
            Use quando alguém (um chefe, um cliente) precisa dar o “ok” nesta tarefa.
          </p>
        ) : null
      ) : (
        <ul className="space-y-3">
          {approvals.map((approval) => {
            const status = APPROVAL_STATUS[approval.status];
            const iAmApprover = approval.approverId === userId;
            const iRequested = approval.requestedBy === userId;
            return (
              <li key={approval.id} className="space-y-2 rounded-lg border border-border/60 p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <MemberAvatar userId={approval.approverId} className="size-6" />
                  <span className="font-medium">{memberName(approval.approverId)}</span>
                  <Badge variant="secondary" className={cn(status.className)}>
                    {status.label}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">
                    pedido por {memberName(approval.requestedBy)} {formatRelativeTime(approval.requestedAt)}
                  </span>
                </div>
                {approval.note ? <p className="text-sm text-muted-foreground">“{approval.note}”</p> : null}
                {approval.decisionNote ? (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Resposta:</span> {approval.decisionNote}
                  </p>
                ) : null}
                {approval.status === "PENDING" && iAmApprover ? (
                  <ApprovalDecisionButtons approvalId={approval.id} />
                ) : null}
                {approval.status === "PENDING" && iRequested && !iAmApprover ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate(approval.id)}
                  >
                    Cancelar pedido
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
