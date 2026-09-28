"use client";

import { PageHeader } from "@/components/shared/page-header";
import { TutorialGuideLink } from "@/components/shared/tutorial-guide-link";
import { PlanPicker } from "@/features/plans/components/plan-picker";
import { UsageWindowsSummary } from "@/features/plans/components/usage-windows-summary";
import { AiUsageHistory } from "@/features/assistant/components/ai-usage-history";

export default function PlanPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Plano"
        description="Escolha o plano de tokens de IA da sua conta."
        actions={<TutorialGuideLink guideId="plans" />}
      />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">Planos disponíveis</h2>
          <p className="text-sm text-muted-foreground">
            Compare os limites e troque de plano quando quiser.
          </p>
        </div>
        <PlanPicker />
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">Seu consumo</h2>
          <p className="text-sm text-muted-foreground">
            Quanto da sua cota de IA você já usou hoje, nesta semana e neste mês.
          </p>
        </div>
        <UsageWindowsSummary />
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">Histórico</h2>
          <p className="text-sm text-muted-foreground">
            Quantos tokens de IA você gastou recentemente.
          </p>
        </div>
        <AiUsageHistory />
      </section>
    </div>
  );
}
