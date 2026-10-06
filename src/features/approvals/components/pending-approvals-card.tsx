"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";
import { useItemQuery } from "@/features/items/hooks/use-items";
import { ApprovalDecisionButtons } from "@/features/approvals/components/approval-decision-buttons";
import { useMyPendingApprovalsQuery } from "@/features/approvals/hooks/use-approvals";
import type { ItemApproval } from "@/types/approval";

function PendingItem({ approval }: { approval: ItemApproval }) {
  const itemQuery = useItemQuery(approval.itemId);

  return (
    <li className="space-y-2 py-3">
      <div>
        <Link
          href={`/folders/${approval.folderId}/items?itemId=${approval.itemId}`}
          className="text-sm font-medium hover:underline"
        >
          {itemQuery.data?.title ?? "Carregando…"}
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
            ? "1 item espera o seu “ok”."
            : `${pending.length} itens esperam o seu “ok”.`}
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
