"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createPlanSchema,
  type CreatePlanFormInput,
  type CreatePlanFormValues,
} from "@/features/plans/schemas";
import { useCreatePlanMutation } from "@/features/plans/hooks/use-plans";
import { DerivedCapsHint } from "@/features/plans/components/derived-caps-hint";
import { getErrorCode, getErrorMessage } from "@/lib/errors";

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlanDialog({ open, onOpenChange }: CreatePlanDialogProps) {
  const createMutation = useCreatePlanMutation();

  const form = useForm<CreatePlanFormInput, unknown, CreatePlanFormValues>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: { name: "", monthlyTokenBudget: 1_000_000 },
  });

  function onSubmit(values: CreatePlanFormValues) {
    createMutation.mutate(values, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
      onError: (error) => {
        if (getErrorCode(error) === "PLAN_NAME_ALREADY_EXISTS") {
          form.setError("name", { message: getErrorMessage(error) });
        }
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo plano</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="PRO" autoFocus {...field} />
                  </FormControl>
                  <FormDescription>
                    Não dá para mudar depois: o nome é a chave fixa do plano, usada por
                    integrações.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="animate-spin" /> : null}
                Criar plano
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
