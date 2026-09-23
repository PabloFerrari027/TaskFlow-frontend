"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { TutorialGuideLink } from "@/components/shared/tutorial-guide-link";
import { PlansTable } from "@/features/plans/components/plans-table";
import { CreatePlanDialog } from "@/features/plans/components/create-plan-dialog";

export default function AdminPlansPage() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos"
        description="Gerencie os planos de tokens de IA disponíveis para os clientes."
        actions={
          <>
            <TutorialGuideLink guideId="plans" />
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Novo plano
            </Button>
          </>
        }
      />

      <PlansTable />
      <CreatePlanDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
