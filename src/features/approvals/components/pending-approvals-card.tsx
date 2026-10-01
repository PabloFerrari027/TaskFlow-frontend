"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";
import { useTaskQuery } from "@/features/tasks/hooks/use-tasks";
import { ApprovalDecisionButtons } from "@/features/approvals/components/approval-decision-buttons";
import { useMyPendingApprovalsQuery } from "@/features/approvals/hooks/use-approvals";
import type { TaskApproval } from "@/types/approval";

function PendingItem({ approval }: { approval: TaskApproval }) {
  const taskQuery = useTaskQuery(approval.taskId);

  return (
    <li className="space-y-2 py-3">
      <div>
        <Link
          href={`/projects/${approval.projectId}/tasks?taskId=${approval.taskId}`}
          className="text-sm font-medium hover:underline"
        >
          {taskQuery.data?.title ?? "Carregando…"}
        </Link>
        <p className="text-xs text-muted-foreground">
          Pedido {formatRelativeTime(approval.requestedAt)}
          {approval.note ? ` · “${approval.note}”` : ""}
        </p>
      </div>
      <ApprovalDecisionButtons approvalId={approval.id} />
    </li>
  );
}

/** "Aguardando minha aprovação" — only shown when there is something to answer. */
export function PendingApprovalsCard() {
  const pendingQuery = useMyPendingApprovalsQuery();
  const pending = pendingQuery.data ?? [];

  if (pendingQuery.isLoading) return <Skeleton className="h-32 w-full" />;
  if (pending.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BadgeCheck className="size-4" aria-hidden /> Aguardando sua aprovação
        </CardTitle>
        <CardDescription>
          {pending.length === 1
            ? "1 tarefa espera o seu “ok”."
            : `${pending.length} tarefas esperam o seu “ok”.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {pending.map((approval) => (
            <PendingItem key={approval.id} approval={approval} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
