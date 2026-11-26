"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import {
  useAiTopUpPacksQuery,
  useStartAiTopUpCheckoutMutation,
} from "@/features/plans/hooks/use-ai-top-ups";
import { describePack } from "@/features/plans/lib/top-up";
import { useBfcacheRestore } from "@/lib/use-bfcache-restore";

/**
 * Pack list → Stripe Checkout. Open it only when `quota.topUp.purchasable`
 * (the callers gate the button). The balance changes only when the webhook
 * arrives; the return handler on /settings/billing waits for it. Shows whole
 * credits and the BRL price: never µUSD or tokens.
 */
export function BuyTopUpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const packsQuery = useAiTopUpPacksQuery({ enabled: open });
  const checkout = useStartAiTopUpCheckoutMutation();
  const packs = packsQuery.data ?? [];
  // isSuccess too: the browser is still leaving for Stripe, keep it locked.
  const locked = checkout.isPending || checkout.isSuccess;
  // Back from Stripe (bfcache): the checkout is still in isSuccess — unlock and close.
  useBfcacheRestore(() => {
    checkout.reset();
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !locked && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Comprar créditos de IA</DialogTitle>
          <DialogDescription>
            Os créditos entram em ação quando o limite do seu plano acaba e valem por 12 meses.
            O pagamento é feito por cartão, em uma página segura do Stripe.
          </DialogDescription>
        </DialogHeader>

        {packsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : packsQuery.isError ? (
          <ErrorState error={packsQuery.error} onRetry={() => packsQuery.refetch()} />
        ) : packs.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="size-6" />}
            title="Nenhum pacote disponível agora"
            description="Tente de novo mais tarde."
          />
        ) : (
          <ul className="space-y-2">
            {packs.map((pack) => {
              const thisOne = checkout.variables === pack.id;
              return (
                <li
                  key={pack.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{pack.name}</p>
                    <p className="text-sm text-muted-foreground">{describePack(pack)}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={locked}
                    loading={thisOne && locked}
                    onClick={() => checkout.mutate(pack.id)}
                  >
                    Comprar
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
