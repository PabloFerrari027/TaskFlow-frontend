"use client";

import { PageHeader } from "@/components/shared/page-header";
import { AiUsageHistory } from "@/features/assistant/components/ai-usage-history";

export default function AiUsagePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Uso de IA"
        description="Histórico do consumo de tokens do assistente e das análises com IA na sua conta."
      />
      <AiUsageHistory />
    </div>
  );
}
