"use client";

import * as React from "react";
import { BadgePercent, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  usePreviewCouponMutation,
  useSetMyPlanMutation,
} from "@/features/plans/hooks/use-plans";
import { describeDiscount, formatPriceCents } from "@/features/plans/lib/price";
import { getErrorCode, getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { CouponPreview, MyPlan, Plan } from "@/types/plan";

/**
 * Switching plan (or applying a coupon to the current one). A coupon is
 * checked first with the preview — nothing is reserved — and redeemed
 * together with the switch: if it is refused then, the plan does not change.
 */
export function ChoosePlanDialog({
  plan,
  myPlan,
  open,
  onOpenChange,
}: {
  plan: Plan;
  myPlan: MyPlan | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [code, setCode] = React.useState("");
  const [preview, setPreview] = React.useState<CouponPreview | null>(null);
  const previewMutation = usePreviewCouponMutation();
  const setMyPlanMutation = useSetMyPlanMutation();

  const isCurrent = myPlan?.plan?.id === plan.id;
  const isFree = plan.monthlyPriceCents === 0;
  const losesDiscount = Boolean(myPlan?.discount) && !isCurrent && !preview;
  const busy = previewMutation.isPending || setMyPlanMutation.isPending;
  const confirmError =
    setMyPlanMutation.error && getErrorCode(setMyPlanMutation.error)?.startsWith("COUPON_")
      ? getErrorMessage(setMyPlanMutation.error)
      : null;

  function check() {
    const value = code.trim();
    if (!value) return;
    setMyPlanMutation.reset();
    previewMutation.mutate(
      { planId: plan.id, code: value },
      { onSuccess: setPreview, onError: () => setPreview(null) }
    );
  }

  function confirm() {
    setMyPlanMutation.mutate(
      { plan, couponCode: preview?.code },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !setMyPlanMutation.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCurrent ? `Aplicar um cupom ao plano ${plan.name}` : `Trocar para o plano ${plan.name}?`}
          </DialogTitle>
          <DialogDescription>
            {isCurrent
              ? "Um cupom novo substitui o desconto que você tem hoje."
              : "O novo limite passa a valer na próxima vez que você usar a IA. Você pode trocar de novo quando quiser."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-baseline justify-between rounded-lg bg-muted/50 p-3">
            <span className="text-sm text-muted-foreground">Preço por mês</span>
            <span className="text-right">
              {preview ? (
                <>
                  <span className="mr-2 text-sm text-muted-foreground line-through">
                    {formatPriceCents(preview.originalPriceCents)}
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    {formatPriceCents(preview.discountedPriceCents)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-semibold text-foreground">
                  {formatPriceCents(plan.monthlyPriceCents)}
                </span>
              )}
            </span>
          </div>

          {!isFree ? (
            <div className="space-y-1.5">
              <Label htmlFor="coupon-code">Cupom de desconto (opcional)</Label>
              {preview ? (
                <div className="flex items-start justify-between gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="flex items-center gap-1.5 font-medium text-foreground">
                      <BadgePercent className="size-4 text-emerald-600" /> {preview.code}
                    </p>
                    <p className="text-muted-foreground">
                      {describeDiscount(preview)}
                      {preview.endsAt ? ` (até ${formatDate(preview.endsAt)})` : ""}.
                    </p>
                    {preview.description ? (
                      <p className="text-xs text-muted-foreground">{preview.description}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Remover cupom"
                    disabled={busy}
                    onClick={() => {
                      setPreview(null);
                      setCode("");
                      setMyPlanMutation.reset();
                    }}
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    check();
                  }}
                >
                  <Input
                    id="coupon-code"
                    value={code}
                    autoCapitalize="characters"
                    placeholder="BLACKFRIDAY30"
                    disabled={busy}
                    onChange={(event) => setCode(event.target.value)}
                  />
                  <Button type="submit" variant="outline" disabled={busy || !code.trim()}>
                    {previewMutation.isPending ? <Loader2 className="animate-spin" /> : null}
                    Aplicar
                  </Button>
                </form>
              )}
              {previewMutation.error ? (
                <p className="text-sm text-destructive">{getErrorMessage(previewMutation.error)}</p>
              ) : null}
            </div>
          ) : null}

          {losesDiscount ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Seu desconto atual ({myPlan?.discount?.couponCode}) vale só para o plano de hoje e
              termina com a troca.
            </p>
          ) : null}
          {confirmError ? <p className="text-sm text-destructive">{confirmError}</p> : null}
          <p className="text-xs text-muted-foreground">
            Ainda não há cobrança: o preço é só informativo por enquanto.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={setMyPlanMutation.isPending} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={busy || (isCurrent && !preview)} onClick={confirm}>
            {setMyPlanMutation.isPending ? <Loader2 className="animate-spin" /> : null}
            {isCurrent ? "Aplicar cupom" : "Trocar de plano"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
