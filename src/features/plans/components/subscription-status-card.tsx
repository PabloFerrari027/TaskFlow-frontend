"use client";

import * as React from "react";
import { BadgePercent, CircleAlert, CircleCheck, Clock, CreditCard, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import {
  useCancelSubscriptionMutation,
  useOpenBillingPortalMutation,
  useResumeSubscriptionMutation,
} from "@/features/plans/hooks/use-billing";
import { useMyPlanQuery } from "@/features/plans/hooks/use-plans";
import { hasSubscriptionEnded, hasSubscriptionInForce } from "@/features/plans/lib/subscription";
import { describeDiscount, formatPriceCents } from "@/features/plans/lib/price";
import { DEFAULT_PLAN_NAME } from "@/features/plans/lib/plan-caps";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MyPlan, Subscription } from "@/types/plan";

type Tone = "warning" | "danger" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  warning: "border-amber-500/40 bg-amber-500/10",
  danger: "border-destructive/40 bg-destructive/10",
  neutral: "border-border bg-muted/50",
};

function Banner({
  tone,
  icon: Icon,
  children,
  action,
}: {
  tone: Tone;
  icon: typeof Info;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        TONE_CLASS[tone]
      )}
    >
      <p className="flex items-start gap-2 text-foreground">
        <Icon className="mt-0.5 size-4 shrink-0" />
        <span>{children}</span>
      </p>
      {action}
    </div>
  );
}

/**
 * The subscription at a glance (`subscription` of `GET /plans/me`): plan,
 * price after the discount, a banner for the state it is in and the actions
 * (portal, cancel, resume). Renders nothing for someone who never subscribed.
 */
export function SubscriptionStatusCard() {
  const myPlanQuery = useMyPlanQuery();
  const portal = useOpenBillingPortalMutation();
  const cancel = useCancelSubscriptionMutation();
  const resume = useResumeSubscriptionMutation();
  const [confirmingCancel, setConfirmingCancel] = React.useState(false);

  if (myPlanQuery.isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (myPlanQuery.isError) {
    return <ErrorState error={myPlanQuery.error} onRetry={() => myPlanQuery.refetch()} />;
  }

  const myPlan = myPlanQuery.data;
  const subscription = myPlan?.subscription;
  if (!myPlan || !subscription) return null;

  const inForce = hasSubscriptionInForce(subscription);
  const ended = hasSubscriptionEnded(subscription);
  const scheduledToCancel = inForce && subscription.cancelAtPeriodEnd;
  const periodEnd = subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : null;
  const busy = portal.isPending || cancel.isPending || resume.isPending;

  const portalButton = (label: string, variant: "default" | "outline" = "outline") => (
    <Button variant={variant} size="sm" disabled={busy} loading={portal.isPending} onClick={() => portal.mutate()}>
      <CreditCard /> {label}
    </Button>
  );

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">Sua assinatura</h2>
          <SubscriptionSummary myPlan={myPlan} subscription={subscription} ended={ended} />
        </div>
        <div className="flex flex-wrap gap-2">
          {inForce ? portalButton("Gerenciar pagamento") : null}
          {scheduledToCancel ? (
            <Button size="sm" disabled={busy} loading={resume.isPending} onClick={() => resume.mutate()}>
              Retomar assinatura
            </Button>
          ) : null}
          {inForce && !scheduledToCancel ? (
            <ConfirmDialog
              open={confirmingCancel}
              onOpenChange={setConfirmingCancel}
              title="Cancelar a assinatura?"
              description={
                periodEnd
                  ? `Você continua com o plano até ${periodEnd}, que é o fim do período já pago. Não há reembolso proporcional, e depois dessa data você volta ao plano ${DEFAULT_PLAN_NAME}. Dá para retomar a assinatura antes disso.`
                  : `Você continua com o plano até o fim do período já pago, sem reembolso proporcional, e depois volta ao plano ${DEFAULT_PLAN_NAME}.`
              }
              confirmLabel="Cancelar assinatura"
              cancelLabel="Manter assinatura"
              isLoading={cancel.isPending}
              onConfirm={() => cancel.mutate(undefined, { onSettled: () => setConfirmingCancel(false) })}
              trigger={
                <Button variant="ghost" size="sm" disabled={busy}>
                  Cancelar assinatura
                </Button>
              }
            />
          ) : null}
        </div>
      </div>

      {subscription.status === "PAST_DUE" ? (
        <Banner
          tone="danger"
          icon={CircleAlert}
          action={portalButton("Atualizar cartão", "default")}
        >
          Não conseguimos cobrar o seu cartão. O plano continua valendo enquanto o Stripe tenta de
          novo; atualize o cartão para não perder o acesso.
        </Banner>
      ) : null}

      {scheduledToCancel ? (
        <Banner tone="warning" icon={Clock}>
          {periodEnd
            ? `Sua assinatura termina em ${periodEnd}. Até lá o plano continua valendo; depois você volta ao plano ${DEFAULT_PLAN_NAME}.`
            : `Sua assinatura está cancelada e termina no fim do período pago.`}
        </Banner>
      ) : null}

      {ended ? (
        <Banner
          tone="neutral"
          icon={Info}
          action={
            <Button asChild size="sm">
              <a href="#planos">Assinar de novo</a>
            </Button>
          }
        >
          Sua assinatura terminou e você voltou ao plano {DEFAULT_PLAN_NAME}. Escolha um plano pago
          para assinar de novo.
        </Banner>
      ) : null}

      {subscription.status === "INCOMPLETE" ? (
        <Banner
          tone="warning"
          icon={Clock}
          action={
            <Button
              variant="outline"
              size="sm"
              loading={myPlanQuery.isFetching}
              onClick={() => myPlanQuery.refetch()}
            >
              Verificar de novo
            </Button>
          }
        >
          Pagamento pendente: ainda não recebemos a confirmação do primeiro pagamento. O plano muda
          assim que ele for confirmado.
        </Banner>
      ) : null}
    </Card>
  );
}

function SubscriptionSummary({
  myPlan,
  subscription,
  ended,
}: {
  myPlan: MyPlan;
  subscription: Subscription;
  ended: boolean;
}) {
  const { plan, discount } = myPlan;
  const inForce = hasSubscriptionInForce(subscription);
  const renewal =
    inForce && !subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd
      ? formatDate(subscription.currentPeriodEnd)
      : null;

  return (
    <div className="space-y-1 text-sm">
      <p className="flex items-center gap-2 font-medium text-foreground">
        <CircleCheck className={cn("size-4", inForce ? "text-primary" : "text-muted-foreground")} />
        Plano {plan?.name ?? DEFAULT_PLAN_NAME}
        {!ended ? (
          <span className="font-normal text-muted-foreground">
            {" · "}
            {formatPriceCents(myPlan.effectiveMonthlyPriceCents)}
            {myPlan.effectiveMonthlyPriceCents > 0 ? "/mês" : ""}
          </span>
        ) : null}
      </p>
      {discount && !ended ? (
        <p className="flex items-start gap-1.5 text-muted-foreground">
          <BadgePercent className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <span>
            Cupom {discount.couponCode}: {describeDiscount(discount)}
            {discount.endsAt ? `, até ${formatDate(discount.endsAt)}` : ""}. Sem ele,{" "}
            {formatPriceCents(discount.originalPriceCents)}/mês.
          </span>
        </p>
      ) : null}
      {renewal ? <p className="text-muted-foreground">Próxima cobrança em {renewal}.</p> : null}
    </div>
  );
}
