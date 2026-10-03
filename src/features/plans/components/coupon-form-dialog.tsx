"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminPlansQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
} from "@/features/plans/hooks/use-plans";
import {
  centsToPriceInput,
  formatPriceCents,
  isValidPriceInput,
  parsePriceInput,
} from "@/features/plans/lib/price";
import { getErrorCode, getErrorMessage, getServerErrorMessage } from "@/lib/errors";
import type { Coupon, CouponDiscountType, CouponDuration } from "@/types/plan";

const CODE = /^[A-Za-z0-9_-]{3,40}$/;

interface FormState {
  code: string;
  description: string;
  discountType: CouponDiscountType;
  percentOff: string;
  amountOff: string;
  duration: CouponDuration;
  durationInMonths: string;
  maxRedemptions: string;
  startsAt: string;
  expiresAt: string;
  planIds: string[];
}

// <input type="datetime-local"> works in local time without a zone.
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function initialState(coupon: Coupon | null): FormState {
  return {
    code: coupon?.code ?? "",
    description: coupon?.description ?? "",
    discountType: coupon?.discountType ?? "PERCENT",
    percentOff: coupon?.percentOff ? String(coupon.percentOff) : "",
    amountOff: coupon?.amountOffCents ? centsToPriceInput(coupon.amountOffCents) : "",
    duration: coupon?.duration ?? "ONCE",
    durationInMonths: coupon?.durationInMonths ? String(coupon.durationInMonths) : "3",
    maxRedemptions: coupon?.maxRedemptions ? String(coupon.maxRedemptions) : "",
    startsAt: toLocalInput(coupon?.startsAt ?? null),
    expiresAt: toLocalInput(coupon?.expiresAt ?? null),
    planIds: coupon?.planIds ?? [],
  };
}

const isInt = (value: string, min: number, max = Number.MAX_SAFE_INTEGER) =>
  /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max;

// The same rules the API enforces (API.md § 23), checked here first.
function validate(state: FormState, editing: boolean): string | null {
  if (!editing) {
    if (!CODE.test(state.code.trim())) return "O código precisa ter de 3 a 40 letras, números, - ou _.";
    if (state.discountType === "PERCENT" && !isInt(state.percentOff, 1, 100)) {
      return "A porcentagem vai de 1 a 100.";
    }
    if (
      state.discountType === "FIXED_AMOUNT" &&
      (!isValidPriceInput(state.amountOff) || parsePriceInput(state.amountOff) < 1)
    ) {
      return "Informe o valor do desconto em reais, como 10,00.";
    }
    if (state.duration === "REPEATING" && !isInt(state.durationInMonths, 1, 36)) {
      return "A duração vai de 1 a 36 meses.";
    }
  }
  if (state.maxRedemptions && !isInt(state.maxRedemptions, 1)) return "O limite de usos precisa ser 1 ou mais.";
  if (state.expiresAt) {
    const expires = new Date(state.expiresAt);
    if (!editing && expires <= new Date()) return "A data final precisa estar no futuro.";
    if (state.startsAt && expires <= new Date(state.startsAt)) return "A data final precisa ser depois da inicial.";
  }
  return null;
}

export function CouponFormDialog({
  coupon,
  open,
  onOpenChange,
}: {
  /** `null` = a new coupon. */
  coupon: Coupon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const editing = coupon !== null;
  const [state, setState] = React.useState<FormState>(() => initialState(coupon));
  const [error, setError] = React.useState<string | null>(null);
  const plansQuery = useAdminPlansQuery();
  const paidPlans = (plansQuery.data ?? []).filter((plan) => plan.monthlyPriceCents > 0);
  const createMutation = useCreateCouponMutation();
  const updateMutation = useUpdateCouponMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((current) => ({ ...current, [key]: value }));

  function onServerError(err: unknown) {
    const code = getErrorCode(err);
    if (code === "COUPON_CODE_ALREADY_EXISTS" || code === "INVALID_COUPON") {
      setError(getServerErrorMessage(err) ?? getErrorMessage(err));
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const problem = validate(state, editing);
    setError(problem);
    if (problem || isPending) return;

    const common = {
      maxRedemptions: state.maxRedemptions ? Number(state.maxRedemptions) : null,
      startsAt: fromLocalInput(state.startsAt),
      expiresAt: fromLocalInput(state.expiresAt),
      planIds: state.planIds,
    };

    if (editing) {
      updateMutation.mutate(
        {
          couponId: coupon.id,
          input: { ...common, description: state.description.trim() || null },
        },
        { onSuccess: () => onOpenChange(false), onError: onServerError }
      );
      return;
    }
    createMutation.mutate(
      {
        code: state.code.trim(),
        description: state.description.trim() || undefined,
        discountType: state.discountType,
        percentOff: state.discountType === "PERCENT" ? Number(state.percentOff) : undefined,
        amountOffCents:
          state.discountType === "FIXED_AMOUNT" ? parsePriceInput(state.amountOff) : undefined,
        duration: state.duration,
        durationInMonths: state.duration === "REPEATING" ? Number(state.durationInMonths) : undefined,
        maxRedemptions: common.maxRedemptions ?? undefined,
        startsAt: common.startsAt ?? undefined,
        expiresAt: common.expiresAt ?? undefined,
        planIds: state.planIds.length > 0 ? state.planIds : undefined,
      },
      { onSuccess: () => onOpenChange(false), onError: onServerError }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? `Editar cupom ${coupon.code}` : "Novo cupom"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "O código e os termos do desconto não mudam. Para mudá-los, desative este cupom e crie outro."
              : "O código é gravado em maiúsculas; quem resgata pode digitar de qualquer jeito."}
          </DialogDescription>
        </DialogHeader>

        <form id="coupon-form" onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="coupon-code-input">Código</Label>
              <Input
                id="coupon-code-input"
                autoFocus={!editing}
                disabled={editing}
                value={state.code}
                placeholder="BLACKFRIDAY30"
                onChange={(event) => set("code", event.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-description">Descrição (opcional)</Label>
              <Input
                id="coupon-description"
                value={state.description}
                placeholder="Black Friday"
                onChange={(event) => set("description", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipo de desconto</Label>
              <Select
                value={state.discountType}
                disabled={editing}
                onValueChange={(value) => set("discountType", value as CouponDiscountType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Porcentagem</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">Valor fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              {state.discountType === "PERCENT" ? (
                <>
                  <Label htmlFor="coupon-percent">Desconto (%)</Label>
                  <Input
                    id="coupon-percent"
                    inputMode="numeric"
                    disabled={editing}
                    value={state.percentOff}
                    placeholder="30"
                    onChange={(event) => set("percentOff", event.target.value)}
                  />
                </>
              ) : (
                <>
                  <Label htmlFor="coupon-amount">Desconto (R$)</Label>
                  <Input
                    id="coupon-amount"
                    inputMode="decimal"
                    disabled={editing}
                    value={state.amountOff}
                    placeholder="10,00"
                    onChange={(event) => set("amountOff", event.target.value)}
                  />
                </>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Duração</Label>
              <Select
                value={state.duration}
                disabled={editing}
                onValueChange={(value) => set("duration", value as CouponDuration)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONCE">Só o primeiro mês</SelectItem>
                  <SelectItem value="REPEATING">Alguns meses</SelectItem>
                  <SelectItem value="FOREVER">Para sempre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {state.duration === "REPEATING" ? (
              <div className="space-y-1.5">
                <Label htmlFor="coupon-months">Meses (1 a 36)</Label>
                <Input
                  id="coupon-months"
                  inputMode="numeric"
                  disabled={editing}
                  value={state.durationInMonths}
                  onChange={(event) => set("durationInMonths", event.target.value)}
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="coupon-max">Limite de usos</Label>
              <Input
                id="coupon-max"
                inputMode="numeric"
                placeholder="Ilimitado"
                value={state.maxRedemptions}
                onChange={(event) => set("maxRedemptions", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-starts">Começa em</Label>
              <Input
                id="coupon-starts"
                type="datetime-local"
                value={state.startsAt}
                onChange={(event) => set("startsAt", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-expires">Termina em</Label>
              <Input
                id="coupon-expires"
                type="datetime-local"
                value={state.expiresAt}
                onChange={(event) => set("expiresAt", event.target.value)}
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">Planos</legend>
            <p className="text-xs text-muted-foreground">
              Sem nenhum marcado, vale para qualquer plano pago. Planos gratuitos nunca aceitam cupom.
            </p>
            {paidPlans.map((plan) => (
              <label key={plan.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={state.planIds.includes(plan.id)}
                  onCheckedChange={(checked) =>
                    set(
                      "planIds",
                      checked
                        ? [...state.planIds, plan.id]
                        : state.planIds.filter((id) => id !== plan.id)
                    )
                  }
                />
                {plan.name}
                <span className="text-muted-foreground">{formatPriceCents(plan.monthlyPriceCents)}/mês</span>
              </label>
            ))}
          </fieldset>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>

        <DialogFooter>
          <Button type="submit" form="coupon-form" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : null}
            {editing ? "Salvar" : "Criar cupom"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
