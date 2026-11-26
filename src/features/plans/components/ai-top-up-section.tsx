"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pager } from "@/components/shared/pager";
import { BuyTopUpDialog } from "@/features/plans/components/buy-top-up-dialog";
import { useMyAiQuotaQuery, useMyAiTopUpsQuery } from "@/features/plans/hooks/use-ai-top-ups";
import { formatPriceCents } from "@/features/plans/lib/price";
import { creditsToMessages, formatCredits } from "@/features/plans/lib/top-up";
import { formatDate } from "@/lib/format";
import type { AiTopUpPurchase, AiTopUpPurchaseStatus } from "@/types/ai-top-up";

const STATUS: Record<AiTopUpPurchaseStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  PENDING: { label: "Aguardando pagamento", variant: "outline" },
  COMPLETED: { label: "Concluída", variant: "default" },
  EXPIRED: { label: "Não concluída", variant: "secondary" },
  PARTIALLY_REFUNDED: { label: "Reembolsada em parte", variant: "secondary" },
  REFUNDED: { label: "Reembolsada", variant: "secondary" },
  DISPUTED: { label: "Em disputa", variant: "destructive" },
};

function PurchaseRow({ purchase }: { purchase: AiTopUpPurchase }) {
  const status = STATUS[purchase.status];
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
      <div className="min-w-0">
        <p className="font-medium text-foreground">
          {purchase.packName} · {formatCredits(purchase.credits)} créditos
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(purchase.completedAt ?? purchase.createdAt)}
          {purchase.refundedCents > 0 ? ` · reembolsado ${formatPriceCents(purchase.refundedCents)}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="tabular-nums text-foreground">{formatPriceCents(purchase.priceCents)}</span>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
    </li>
  );
}

/**
 * "Recarga de IA" on /settings/billing: balance in whole credits, what
 * expires next, buy button and the purchase history. The button needs
 * `quota.topUp.purchasable`; with the feature off (history answers an error)
 * or nothing to show, the section is not rendered at all.
 */
export function AiTopUpSection() {
  const [page, setPage] = React.useState(1);
  const [buyOpen, setBuyOpen] = React.useState(false);
  const quotaQuery = useMyAiQuotaQuery();
  const mineQuery = useMyAiTopUpsQuery(page);

  if (quotaQuery.isPending || mineQuery.isPending) return <Skeleton className="h-40 w-full" />;
  const purchasable = quotaQuery.data?.topUp.purchasable ?? false;
  const mine = mineQuery.data;
  if (!mine) return null;

  const { balance, purchases } = mine;
  if (!purchasable && balance.credits === 0 && purchases.meta.total === 0) return null;

  return (
    <section id="recarga" className="scroll-mt-20 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-medium text-foreground">Recarga de IA</h2>
        <p className="text-sm text-muted-foreground">
          Créditos extras para quando o limite do seu plano acabar. Valem por 12 meses e não
          mudam se você trocar de plano.
        </p>
      </div>

      <Card className="gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Seu saldo</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {formatCredits(balance.credits)} créditos
            </p>
            <p className="text-xs text-muted-foreground">
              ≈ {formatCredits(creditsToMessages(balance.credits))} mensagens com o assistente
            </p>
          </div>
          {purchasable ? (
            <Button onClick={() => setBuyOpen(true)}>
              <Sparkles /> Comprar créditos
            </Button>
          ) : null}
        </div>
        {balance.credits > 0 && balance.nextExpiresAt ? (
          <p className="text-sm text-foreground">
            {formatCredits(balance.nextExpiringCredits)} créditos vencem em{" "}
            {formatDate(balance.nextExpiresAt)}.
          </p>
        ) : null}
        {!purchasable ? (
          <p className="text-xs text-muted-foreground">
            A compra de créditos não está disponível para a sua conta agora.
          </p>
        ) : null}
      </Card>

      {purchases.data.length > 0 ? (
        <div className={mineQuery.isPlaceholderData ? "space-y-2 opacity-60" : "space-y-2"}>
          <h3 className="text-sm font-medium text-foreground">Compras</h3>
          <ul className="divide-y divide-border/60">
            {purchases.data.map((purchase) => (
              <PurchaseRow key={purchase.id} purchase={purchase} />
            ))}
          </ul>
          <Pager meta={purchases.meta} isLoading={mineQuery.isFetching} onPageChange={setPage} />
        </div>
      ) : null}

      {purchasable ? <BuyTopUpDialog open={buyOpen} onOpenChange={setBuyOpen} /> : null}
    </section>
  );
}
