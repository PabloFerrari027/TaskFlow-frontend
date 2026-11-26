"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { TutorialGuideLink } from "@/components/shared/tutorial-guide-link";
import { FoldedSection } from "@/components/shared/folded-section";
import { CheckoutReturnHandler } from "@/features/plans/components/checkout-return-handler";
import { SubscriptionStatusCard } from "@/features/plans/components/subscription-status-card";
import { PlanPicker } from "@/features/plans/components/plan-picker";
import { AssistantAllowanceCard } from "@/features/plans/components/assistant-allowance-card";
import { UsageWindowsSummary } from "@/features/plans/components/usage-windows-summary";
import { AiUsageHistory } from "@/features/assistant/components/ai-usage-history";

// Single page for plan + subscription (+ AI top-ups later). It is where Stripe
// sends the user back (BILLING_*_URL → /settings/billing). `/settings/plan`
// redirects here.
export default function BillingPage() {
  return (
    <div className="space-y-8">
      {/* useSearchParams: keep it behind a Suspense boundary (Next 16). */}
      <Suspense fallback={null}>
        <CheckoutReturnHandler />
      </Suspense>

      <PageHeader
        title="Plano e cobrança"
        description="Seu plano, a assinatura e quanto você pode conversar com o assistente."
        actions={<TutorialGuideLink guideId="plans" />}
      />

      <SubscriptionStatusCard />

      <AssistantAllowanceCard />

      {/*
        TODO(PR-4, recarga de IA): a seção "Recarga de IA" (saldo, comprar
        pacote, lotes a vencer) entra aqui, entre o consumo e os planos.
        Fora do escopo deste PR (decisões-v1: rotas /billing/ai-top-ups,
        flag billing.ai_top_ups).
      */}

      <section id="planos" className="scroll-mt-20 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">Planos disponíveis</h2>
          <p className="text-sm text-muted-foreground">
            Compare os limites e troque de plano quando quiser.
          </p>
        </div>
        <PlanPicker />
      </section>

      <FoldedSection
        title="Ver detalhes técnicos"
        hint="O consumo em tokens (a unidade que a IA cobra) por dia, semana e mês, e o histórico"
      >
        <UsageWindowsSummary />
        <AiUsageHistory />
      </FoldedSection>
    </div>
  );
}
