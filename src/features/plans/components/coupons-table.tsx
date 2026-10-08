"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power, Search, Ticket, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Pager } from "@/components/shared/pager";
import { CouponFormDialog } from "@/features/plans/components/coupon-form-dialog";
import {
  useAdminPlansQuery,
  useCouponRedemptionsQuery,
  useCouponsQuery,
  useDeleteCouponMutation,
  useUpdateCouponMutation,
} from "@/features/plans/hooks/use-plans";
import { describeDiscount, formatPriceCents } from "@/features/plans/lib/price";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { formatDate, formatDateTime } from "@/lib/format";
import { isForbiddenError } from "@/lib/errors";
import type { Coupon, CouponStatusFilter } from "@/types/plan";

const PAGE_SIZE = 20;
const ALL = "__all__";

type Pending =
  | { kind: "edit"; coupon: Coupon }
  | { kind: "delete"; coupon: Coupon }
  | { kind: "redemptions"; coupon: Coupon }
  | null;

function validity(coupon: Coupon) {
  const now = Date.now();
  if (!coupon.isActive) return { label: "Desativado", variant: "secondary" as const };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= now) {
    return { label: "Expirado", variant: "secondary" as const };
  }
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) {
    return { label: "Agendado", variant: "outline" as const };
  }
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { label: "Esgotado", variant: "secondary" as const };
  }
  return { label: "Ativo", variant: "default" as const };
}

function RedemptionsDialog({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
  const [page, setPage] = React.useState(1);
  const query = useCouponRedemptionsQuery(coupon.id, page);
  const result = query.data;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quem usou {coupon.code}</DialogTitle>
          <DialogDescription>
            {coupon.redemptionCount} {coupon.redemptionCount === 1 ? "uso" : "usos"}
            {coupon.maxRedemptions !== null ? ` de ${coupon.maxRedemptions}` : ""}.
          </DialogDescription>
        </DialogHeader>
        {query.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : !result || result.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguém usou este cupom ainda.</p>
        ) : (
          <div className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead>Resgatado</TableHead>
                  <TableHead>Até</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell className="max-w-48 truncate">{redemption.userEmail}</TableCell>
                    <TableCell>{redemption.planName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="mr-1 text-xs text-muted-foreground line-through">
                        {formatPriceCents(redemption.originalPriceCents)}
                      </span>
                      {formatPriceCents(redemption.discountedPriceCents)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(redemption.redeemedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {redemption.canceledAt ? (
                        <Badge variant="secondary">Encerrado em {formatDate(redemption.canceledAt)}</Badge>
                      ) : redemption.endsAt ? (
                        formatDate(redemption.endsAt)
                      ) : (
                        "Sem fim"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pager meta={result.meta} isLoading={query.isFetching} onPageChange={setPage} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CouponsTable() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [status, setStatus] = React.useState<CouponStatusFilter | undefined>(undefined);
  const [page, setPage] = React.useState(1);
  const [pending, setPending] = React.useState<Pending>(null);

  const couponsQuery = useCouponsQuery({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status,
  });
  const plansQuery = useAdminPlansQuery();
  const planNames = new Map((plansQuery.data ?? []).map((plan) => [plan.id, plan.name]));
  const updateMutation = useUpdateCouponMutation();
  const deleteMutation = useDeleteCouponMutation();

  // `GET /admin/coupons` is itself SUPER_ADMIN-only — same inference as PlansTable.
  React.useEffect(() => {
    if (
      couponsQuery.isError &&
      isForbiddenError(couponsQuery.error)
    ) {
      router.replace("/403");
    }
  }, [couponsQuery.isError, couponsQuery.error, router]);

  const result = couponsQuery.data;
  const close = () => setPending(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <InputGroup className="sm:max-w-xs">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Buscar pelo código"
            aria-label="Buscar cupons"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </InputGroup>
        <Select
          value={status ?? ALL}
          onValueChange={(value) => {
            setStatus(value === ALL ? undefined : (value as CouponStatusFilter));
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Situação" className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            <SelectItem value="ACTIVE">Ativos</SelectItem>
            <SelectItem value="INACTIVE">Desativados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {couponsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : couponsQuery.isError && !result ? (
        <ErrorState error={couponsQuery.error} onRetry={() => couponsQuery.refetch()} />
      ) : !result || result.data.length === 0 ? (
        <EmptyState
          icon={<Ticket className="size-6" />}
          title={debouncedSearch || status ? "Nenhum cupom com esses filtros" : "Nenhum cupom ainda"}
          description="Cupons dão desconto no preço mensal dos planos pagos."
        />
      ) : (
        <div className={couponsQuery.isPlaceholderData ? "space-y-3 opacity-60" : "space-y-3"}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Planos</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="w-36" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((coupon) => {
                const state = validity(coupon);
                return (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <p className="font-mono font-medium text-foreground">{coupon.code}</p>
                      {coupon.description ? (
                        <p className="text-xs text-muted-foreground">{coupon.description}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-56 text-sm">{describeDiscount(coupon)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {coupon.planIds.length === 0
                        ? "Qualquer plano pago"
                        : coupon.planIds.map((id) => planNames.get(id) ?? "?").join(", ")}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {coupon.redemptionCount}
                      {coupon.maxRedemptions !== null ? ` / ${coupon.maxRedemptions}` : ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {coupon.startsAt ? `de ${formatDate(coupon.startsAt)} ` : ""}
                      {coupon.expiresAt ? `até ${formatDate(coupon.expiresAt)}` : coupon.startsAt ? "" : "Sem prazo"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={state.variant}>{state.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Quem usou"
                          title="Quem usou"
                          onClick={() => setPending({ kind: "redemptions", coupon })}
                        >
                          <Users />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={coupon.isActive ? "Desativar" : "Ativar"}
                          title={coupon.isActive ? "Desativar" : "Ativar"}
                          disabled={updateMutation.isPending}
                          onClick={() =>
                            updateMutation.mutate({
                              couponId: coupon.id,
                              input: { isActive: !coupon.isActive },
                            })
                          }
                        >
                          <Power />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Editar"
                          title="Editar"
                          onClick={() => setPending({ kind: "edit", coupon })}
                        >
                          <Pencil />
                        </Button>
                        {coupon.redemptionCount === 0 ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Apagar"
                            title="Apagar"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setPending({ kind: "delete", coupon })}
                          >
                            <Trash2 />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pager meta={result.meta} isLoading={couponsQuery.isFetching} onPageChange={setPage} />
        </div>
      )}

      {pending?.kind === "edit" ? (
        <CouponFormDialog coupon={pending.coupon} open onOpenChange={(open) => !open && close()} />
      ) : null}
      {pending?.kind === "redemptions" ? (
        <RedemptionsDialog coupon={pending.coupon} onClose={close} />
      ) : null}
      <ConfirmDialog
        open={pending?.kind === "delete"}
        onOpenChange={(open) => !open && close()}
        trigger={<span className="hidden" />}
        title={`Apagar o cupom ${pending?.kind === "delete" ? pending.coupon.code : ""}?`}
        description="Só dá para apagar um cupom que ninguém usou. Isso não pode ser desfeito."
        confirmLabel="Apagar cupom"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (pending?.kind !== "delete") return;
          deleteMutation.mutate(pending.coupon.id, { onSettled: close });
        }}
      />
    </div>
  );
}
