"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAiSettingsQuery } from "@/features/admin/hooks/use-ai-settings";
import { TaskModelsCard } from "@/features/admin/components/ai-settings/task-models-card";
import { RuleGroupCard } from "@/features/admin/components/ai-settings/rule-group-card";

const PLAN_STORAGE_KEY = "admin-ai-plan";

function readStoredPlan(): string | null {
  try {
    return window.localStorage.getItem(PLAN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Tudo da IA por plano (API.md § 30): escolhe o plano em cima, e modelos e regras valem para ele. */
export default function AdminAiSettingsPage() {
  const query = useAiSettingsQuery();
  const [planId, setPlanId] = React.useState<string | null>(null);
  const plans = query.data?.plans ?? [];
  const selected = plans.find((plan) => plan.id === planId) ?? plans.find((plan) => plan.id === readStoredPlan()) ?? plans[0];

  function choosePlan(id: string) {
    setPlanId(id);
    try {
      window.localStorage.setItem(PLAN_STORAGE_KEY, id);
    } catch {
      // Só uma conveniência: sem storage, a tela abre no primeiro plano.
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inteligência artificial"
        description="O que o assistente segue e qual modelo faz cada trabalho, em cada plano. As garantias de segurança nunca desligam."
      />

      {query.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : query.isError || !selected ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Configurando o plano</span>
            <Tabs value={selected.id} onValueChange={choosePlan}>
              <TabsList>
                {plans.map((plan) => (
                  <TabsTrigger key={plan.id} value={plan.id}>
                    {plan.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <TaskModelsCard settings={query.data!} planId={selected.id} />

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Regras do assistente</h2>
            <p className="text-sm text-muted-foreground">
              Frases são o que o assistente lê em toda mensagem. Travas do sistema são conferências que o
              servidor faz antes de agir. Desligar um grupo desliga tudo dentro dele, só no{" "}
              {selected.name}. Menos regras gastam menos tokens, mas o assistente erra mais.
            </p>
          </div>
          {query.data!.groups.map((group) => (
            <RuleGroupCard key={group.key} group={group} planId={selected.id} planName={selected.name} />
          ))}
        </>
      )}
    </div>
  );
}
