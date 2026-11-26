"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { TutorialGuideLink } from "@/components/shared/tutorial-guide-link";
import { PlansTable } from "@/features/plans/components/plans-table";
import { CreatePlanDialog } from "@/features/plans/components/create-plan-dialog";
import { AiTopUpPacksTable } from "@/features/plans/components/ai-top-up-packs-table";

export default function AdminPlansPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [tab, setTab] = React.useState("plans");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos"
        description="Gerencie os planos de tokens de IA e os pacotes de recarga disponíveis para os clientes."
        actions={
          <>
            <TutorialGuideLink guideId="plans" />
            {tab === "plans" ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus /> Novo plano
              </Button>
            ) : null}
          </>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="top-up-packs">Pacotes de recarga</TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="pt-4">
          <PlansTable />
        </TabsContent>
        <TabsContent value="top-up-packs" className="pt-4">
          <AiTopUpPacksTable />
        </TabsContent>
      </Tabs>
      <CreatePlanDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
