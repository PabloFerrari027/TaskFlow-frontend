"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import {
  useCalendarFeedQuery,
  useCreateCalendarFeedMutation,
  useRemoveCalendarFeedMutation,
} from "@/features/notifications/hooks/use-notifications";

// The link is shown only right after it is created: the server keeps just a hash of it.
export function CalendarFeedSection() {
  const feedQuery = useCalendarFeedQuery();
  const createMutation = useCreateCalendarFeedMutation();
  const removeMutation = useRemoveCalendarFeedMutation();
  const [url, setUrl] = useState<string | null>(null);

  function create() {
    createMutation.mutate(undefined, { onSuccess: (created) => setUrl(created) });
  }

  function remove() {
    removeMutation.mutate(undefined, { onSuccess: () => setUrl(null) });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não deu para copiar. Selecione o link e copie.");
    }
  }

  const busy = createMutation.isPending || removeMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ver no Google Agenda ou no calendário do celular</CardTitle>
        <CardDescription>
          Crie um link e cole no seu calendário (no Google Agenda: Outras agendas → + → Do URL). Os
          seus itens com prazo e os lembretes que se repetem aparecem lá e se atualizam sozinhos de
          tempos em tempos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {feedQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : feedQuery.isError ? (
          <ErrorState error={feedQuery.error} onRetry={() => feedQuery.refetch()} />
        ) : url ? (
          <>
            <div className="flex gap-2">
              <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Link do calendário" />
              <Button onClick={copy}>Copiar</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Guarde este link só para você: quem tiver ele vê os seus prazos. Ele só aparece agora.
            </p>
          </>
        ) : feedQuery.data ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-foreground">Seu link está ativo.</p>
            <Button variant="outline" size="sm" onClick={create} disabled={busy}>
              Criar um novo link
            </Button>
            <Button variant="ghost" size="sm" onClick={remove} disabled={busy}>
              Desligar
            </Button>
            <p className="w-full text-xs text-muted-foreground">
              Criar um novo link faz o antigo parar de funcionar.
            </p>
          </div>
        ) : (
          <Button onClick={create} disabled={busy}>
            Criar link do calendário
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
