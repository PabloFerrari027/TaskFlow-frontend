"use client";

import * as React from "react";
import { BadgePercent, X } from "lucide-react";
import Link from "next/link";
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
  useChangeSubscriptionPlanMutation,
  useStartCheckoutMutation,
} from "@/features/plans/hooks/use-billing";
import {
  usePreviewCouponMutation,
  useSetMyPlanMutation,
} from "@/features/plans/hooks/use-plans";
import { hasSubscriptionInForce } from "@/features/plans/lib/subscription";
import { describeDiscount, formatPriceCents } from "@/features/plans/lib/price";
import { getErrorCode, getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { CouponPreview, MyPlan, Plan } from "@/types/plan";

/**
 * Switching plan (or applying a coupon to the current one). What "confirm"
 * does depends on the plan and the subscription:
 * - free plan → `PATCH /plans/me` (with a subscription in force it is not
 *   possible: the user cancels it instead);
 * - paid plan, no subscription in force → Stripe Checkout (+ coupon);
 * - paid plan, subscription ACTIVE/TRIALING/PAST_DUE → change the subscription
 *   (+ coupon), charging the pro-rata difference right away on an upgrade.
 * A coupon is checked first with the preview — nothing is reserved — and
 * redeemed together with the action: if it is refused then, nothing changes.
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
  const checkoutMutation = useStartCheckoutMutation();
  const changeMutation = useChangeSubscriptionPlanMutation();

  const isCurrent = myPlan?.plan?.id === plan.id;
  const isFree = plan.monthlyPriceCents === 0;
  const subscribed = hasSubscriptionInForce(myPlan?.subscription);
  const action: "free" | "cancel-first" | "checkout" | "change" = isFree
    ? subscribed
      ? "cancel-first"
      : "free"
    : subscribed
      ? "change"
      : "checkout";
  const losesDiscount = Boolean(myPlan?.discount) && !isCurrent && !preview;
  // The mutation of the chosen branch: its pending state and coupon error.
  const confirmMutation =
    action === "checkout" ? checkoutMutation : action === "change" ? changeMutation : setMyPlanMutation;
  // isSuccess too: a checkout is "done" once the URL arrives, while the browser
  // is still leaving for Stripe — keep the button locked so it is not clicked twice.
  const confirming = confirmMutation.isPending || confirmMutation.isSuccess;
  const busy = previewMutation.isPending || confirming;
  const confirmError =
    confirmMutation.error && getErrorCode(confirmMutation.error)?.startsWith("COUPON_")
      ? getErrorMessage(confirmMutation.error)
      : null;

  function check() {
    const value = code.trim();
    if (!value) return;
    confirmMutation.reset();
    previewMutation.mutate(
      { planId: plan.id, code: value },
      { onSuccess: setPreview, onError: () => setPreview(null) }
    );
  }

  function confirm() {
    const done = { onSuccess: () => onOpenChange(false) };
    if (action === "checkout") {
      // Leaves for Stripe; the dialog stays locked (isSuccess) until the page unloads.
      checkoutMutation.mutate({ planId: plan.id, couponCode: preview?.code });
    } else if (action === "change") {
      changeMutation.mutate({ plan, couponCode: preview?.code }, done);
    } else if (action === "free") {
      setMyPlanMutation.mutate({ plan }, done);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !confirming && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCurrent
              ? `Aplicar um cupom ao plano ${plan.name}`
              : action === "checkout"
                ? `Assinar o plano ${plan.name}`
                : `Trocar para o plano ${plan.name}?`}
          </DialogTitle>
          <DialogDescription>
            {isCurrent
              ? "Um cupom novo substitui o desconto que você tem hoje."
              : action === "checkout"
                ? "Você paga com cartão numa página segura do Stripe e volta para cá. O plano muda assim que o pagamento é confirmado."
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
                      confirmMutation.reset();
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
                  <Button type="submit" variant="outline" disabled={busy || !code.trim()} loading={previewMutation.isPending}>
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
          {action === "change" ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              A diferença até o fim do período é calculada proporcionalmente. Ao subir de plano, ela
              é cobrada agora no cartão que você já cadastrou; ao descer, vira crédito nas próximas
              faturas.
            </p>
          ) : null}
          {action === "cancel-first" ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Você tem uma assinatura paga. Para voltar ao plano gratuito, cancele a assinatura: o
              plano atual continua valendo até o fim do período que você já pagou.
            </p>
          ) : null}
          {confirmError ? <p className="text-sm text-destructive">{confirmError}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={confirming} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {action === "cancel-first" ? (
            <Button asChild onClick={() => onOpenChange(false)}>
              <Link href="/settings/billing">Gerenciar assinatura</Link>
            </Button>
          ) : (
            <Button
              disabled={busy || (isCurrent && !preview)}
              onClick={confirm}
              loading={confirming}
            >
              {isCurrent
                ? "Aplicar cupom"
                : action === "checkout"
                  ? "Ir para o pagamento"
                  : "Trocar de plano"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
