"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateAiTopUpPackMutation,
  useUpdateAiTopUpPackMutation,
} from "@/features/plans/hooks/use-ai-top-ups";
import { centsToPriceInput, isValidPriceInput, parsePriceInput } from "@/features/plans/lib/price";
import { getErrorCode, getErrorMessage, getServerErrorMessage } from "@/lib/errors";
import type { AiTopUpPackAdmin } from "@/types/ai-top-up";

interface FormState {
  name: string;
  credits: string;
  price: string;
  sortOrder: string;
  isActive: boolean;
}

function initialState(pack: AiTopUpPackAdmin | null): FormState {
  return {
    name: pack?.name ?? "",
    credits: pack ? String(pack.credits) : "",
    price: pack ? centsToPriceInput(pack.priceCents) : "",
    sortOrder: pack ? String(pack.sortOrder) : "0",
    isActive: pack?.isActive ?? true,
  };
}

const isInt = (value: string, min: number) => /^\d{1,9}$/.test(value) && Number(value) >= min;

function validate(state: FormState): string | null {
  if (!state.name.trim()) return "Dê um nome ao pacote.";
  if (!isInt(state.credits, 1)) return "Os créditos precisam ser um número inteiro de 1 ou mais.";
  if (!isValidPriceInput(state.price) || parsePriceInput(state.price) < 1) {
    return "Informe o preço em reais, como 9,90.";
  }
  if (!isInt(state.sortOrder, 0)) return "A ordem precisa ser um número inteiro, 0 ou mais.";
  return null;
}

// Credits are whole numbers and the price is typed in R$ and sent in cents
// (parsePriceInput). Never µUSD.
export function AiTopUpPackFormDialog({
  pack,
  open,
  onOpenChange,
}: {
  /** `null` = a new pack. */
  pack: AiTopUpPackAdmin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const editing = pack !== null;
  const [state, setState] = React.useState<FormState>(() => initialState(pack));
  const [error, setError] = React.useState<string | null>(null);
  const createMutation = useCreateAiTopUpPackMutation();
  const updateMutation = useUpdateAiTopUpPackMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((current) => ({ ...current, [key]: value }));

  function onServerError(err: unknown) {
    const code = getErrorCode(err);
    if (code === "AI_TOP_UP_PACK_NAME_ALREADY_EXISTS" || code === "INVALID_AI_TOP_UP_PACK") {
      setError(getServerErrorMessage(err) ?? getErrorMessage(err));
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const problem = validate(state);
    setError(problem);
    if (problem || isPending) return;

    const input = {
      name: state.name.trim(),
      credits: Number(state.credits),
      priceCents: parsePriceInput(state.price),
      isActive: state.isActive,
      sortOrder: Number(state.sortOrder),
    };
    const done = { onSuccess: () => onOpenChange(false), onError: onServerError };
    if (editing) updateMutation.mutate({ packId: pack.id, input }, done);
    else createMutation.mutate(input, done);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? `Editar ${pack.name}` : "Novo pacote de recarga"}</DialogTitle>
          <DialogDescription>
            Quem já comprou não é afetado: o preço e os créditos de cada compra ficam gravados.
          </DialogDescription>
        </DialogHeader>

        <form id="top-up-pack-form" onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pack-name">Nome</Label>
            <Input
              id="pack-name"
              autoFocus={!editing}
              value={state.name}
              placeholder="Recarga P"
              onChange={(event) => set("name", event.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pack-credits">Créditos</Label>
              <Input
                id="pack-credits"
                inputMode="numeric"
                value={state.credits}
                placeholder="500"
                onChange={(event) => set("credits", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pack-price">Preço (R$)</Label>
              <Input
                id="pack-price"
                inputMode="decimal"
                value={state.price}
                placeholder="9,90"
                onChange={(event) => set("price", event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pack-order">Ordem na lista</Label>
            <Input
              id="pack-order"
              inputMode="numeric"
              value={state.sortOrder}
              onChange={(event) => set("sortOrder", event.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={state.isActive} onCheckedChange={(checked) => set("isActive", checked === true)} />
            Disponível para compra
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>

        <DialogFooter>
          <Button type="submit" form="top-up-pack-form" disabled={isPending} loading={isPending}>
            {editing ? "Salvar" : "Criar pacote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
