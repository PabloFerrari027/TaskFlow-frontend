"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Pencil, Wallet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { formatDate } from "@/lib/format";
import { useAdminPlansQuery } from "@/features/plans/hooks/use-plans";
import { EditPlanDialog } from "@/features/plans/components/edit-plan-dialog";
import type { Plan } from "@/types/plan";

const numberFormat = new Intl.NumberFormat("pt-BR");

export function PlansTable() {
  const router = useRouter();
  const plansQuery = useAdminPlansQuery();
  const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null);

  // `GET /admin/plans` is itself SUPER_ADMIN-only — a non-admin gets a 403,
  // same inference `ClientsTable` relies on (no endpoint exposes the caller's
  // platform role directly).
  React.useEffect(() => {
    if (
      plansQuery.isError &&
      axios.isAxiosError(plansQuery.error) &&
      plansQuery.error.response?.status === 403
    ) {
      router.replace("/403");
    }
  }, [plansQuery.isError, plansQuery.error, router]);

  if (plansQuery.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (plansQuery.isError) {
    return <ErrorState error={plansQuery.error} onRetry={() => plansQuery.refetch()} />;
  }

  const plans = plansQuery.data ?? [];

  if (plans.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="size-6" />}
        title="Nenhum plano cadastrado"
        description="Crie o primeiro plano para poder atribuí-lo a clientes."
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="text-right">Tokens/mês</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium text-foreground">{plan.name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {numberFormat.format(plan.monthlyTokenBudget)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(plan.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditingPlan(plan)}>
                    <Pencil />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingPlan ? (
        <EditPlanDialog
          plan={editingPlan}
          open={editingPlan !== null}
          onOpenChange={(open) => {
            if (!open) setEditingPlan(null);
          }}
        />
      ) : null}
    </>
  );
}
