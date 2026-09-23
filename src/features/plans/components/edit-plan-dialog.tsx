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
      { onSuccess: () => onOpenChange(false) }
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
              <Label>Nome</Label>
              <Input value={plan.name} disabled readOnly />
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
