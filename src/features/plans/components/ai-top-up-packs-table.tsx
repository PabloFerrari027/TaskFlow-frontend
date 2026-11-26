"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Power, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { AiTopUpPackFormDialog } from "@/features/plans/components/ai-top-up-pack-form-dialog";
import {
  useAdminAiTopUpPacksQuery,
  useUpdateAiTopUpPackMutation,
} from "@/features/plans/hooks/use-ai-top-ups";
import { formatPriceCents } from "@/features/plans/lib/price";
import { formatCredits } from "@/features/plans/lib/top-up";
import { isForbiddenError } from "@/lib/errors";
import type { AiTopUpPackAdmin } from "@/types/ai-top-up";

type Editing = { pack: AiTopUpPackAdmin | null } | null;

export function AiTopUpPacksTable() {
  const router = useRouter();
  const query = useAdminAiTopUpPacksQuery();
  const updateMutation = useUpdateAiTopUpPackMutation();
  const [editing, setEditing] = React.useState<Editing>(null);

  // SUPER_ADMIN-only endpoint, same inference as PlansTable.
  React.useEffect(() => {
    if (query.isError && isForbiddenError(query.error)) router.replace("/403");
  }, [query.isError, query.error, router]);

  const packs = [...(query.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ pack: null })}>
          <Plus /> Novo pacote
        </Button>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : packs.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title="Nenhum pacote ainda"
          description="Pacotes de recarga são os créditos de IA que os usuários compram avulso."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Créditos</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Ordem</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {packs.map((pack) => (
              <TableRow key={pack.id}>
                <TableCell className="font-medium text-foreground">{pack.name}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCredits(pack.credits)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPriceCents(pack.priceCents)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{pack.sortOrder}</TableCell>
                <TableCell>
                  <Badge variant={pack.isActive ? "default" : "secondary"}>
                    {pack.isActive ? "Ativo" : "Desativado"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={pack.isActive ? "Desativar" : "Ativar"}
                      title={pack.isActive ? "Desativar" : "Ativar"}
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({ packId: pack.id, input: { isActive: !pack.isActive } })
                      }
                    >
                      <Power />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Editar"
                      title="Editar"
                      onClick={() => setEditing({ pack })}
                    >
                      <Pencil />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {editing ? (
        <AiTopUpPackFormDialog
          key={editing.pack?.id ?? "new"}
          pack={editing.pack}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}
    </div>
  );
}
