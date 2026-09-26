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

      <PlanPicker />

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Seu consumo</h2>
        <UsageWindowsSummary />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Histórico</h2>
        <AiUsageHistory />
      </div>
    </div>
  );
}
