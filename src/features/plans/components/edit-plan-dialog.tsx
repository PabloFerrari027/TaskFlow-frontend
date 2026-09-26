"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  editPlanSchema,
  type EditPlanFormInput,
  type EditPlanFormValues,
} from "@/features/plans/schemas";
import { useUpdatePlanMutation } from "@/features/plans/hooks/use-plans";
import { DerivedCapsHint } from "@/features/plans/components/derived-caps-hint";
import { getErrorCode } from "@/lib/errors";
import type { Plan } from "@/types/plan";

interface EditPlanDialogProps {
  plan: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// `name` is the plan's stable key (API.md § 23) and is intentionally not a
// field here — only shown as read-only context.
export function EditPlanDialog({ plan, open, onOpenChange }: EditPlanDialogProps) {
  const updateMutation = useUpdatePlanMutation();

  const form = useForm<EditPlanFormInput, unknown, EditPlanFormValues>({
    resolver: zodResolver(editPlanSchema),
    values: { monthlyTokenBudget: plan.monthlyTokenBudget },
  });

  function onSubmit(values: EditPlanFormValues) {
    updateMutation.mutate(
      { planId: plan.id, monthlyTokenBudget: values.monthlyTokenBudget },
      {
        onSuccess: () => onOpenChange(false),
        // The plan is gone — the hook already refreshed the list, so there's
        // nothing left to edit here.
        onError: (error) => {
          if (getErrorCode(error) === "PLAN_NOT_FOUND") onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar plano</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Nome</Label>
              <Input id="plan-name" value={plan.name} disabled readOnly />
              <p className="text-sm text-muted-foreground">
                O nome não pode ser alterado: ele é a chave fixa do plano, usada por integrações e
                pelo plano padrão da plataforma. Só o limite mensal é editável.
              </p>
            </div>

            <FormField
              control={form.control}
              name="monthlyTokenBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tokens por mês</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      autoFocus
                      {...field}
                      value={field.value as number}
                    />
                  </FormControl>
                  <DerivedCapsHint value={field.value} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
