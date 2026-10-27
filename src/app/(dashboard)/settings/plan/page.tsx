"use client";

import { PageHeader } from "@/components/shared/page-header";
import { TutorialGuideLink } from "@/components/shared/tutorial-guide-link";
import { FoldedSection } from "@/components/shared/folded-section";
import { PlanPicker } from "@/features/plans/components/plan-picker";
import { AssistantAllowanceCard } from "@/features/plans/components/assistant-allowance-card";
import { UsageWindowsSummary } from "@/features/plans/components/usage-windows-summary";
import { AiUsageHistory } from "@/features/assistant/components/ai-usage-history";

export default function PlanPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Plano"
        description="Quanto você pode conversar com o assistente."
        actions={<TutorialGuideLink guideId="plans" />}
      />

      <AssistantAllowanceCard />

      <section className="space-y-4">
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
