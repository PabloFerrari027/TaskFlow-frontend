"use client";

import { CloudOff, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSync } from "@/features/sync/context/sync-context";

/**
 * Editing an *existing* task, project, section, or custom field definition
 * (and deleting an existing section or comment) queues while offline.
 * Creating anything new stays online-only across the board — offline
 * creates need a client-generated id plus optimistic list rendering and
 * id reconciliation once synced, which is a distinct, larger feature than
 * queueing edits to things that already have a server id. Task custom
 * field values also stay online-only: unlike every other § 13 entity they
 * have no `version` field, so there's no `baseVersion` to key optimistic
 * concurrency off. This indicator just surfaces the edit/delete queue.
 */
export function SyncStatusIndicator() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useSync();

  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  const label = !isOnline
    ? pendingCount > 0
      ? `Offline — ${pendingCount} alteração(ões) pendente(s) de sincronização.`
      : "Você está offline. Alterações em tarefas e projetos serão salvas localmente."
    : isSyncing
      ? "Sincronizando alterações pendentes…"
      : `${pendingCount} alteração(ões) aguardando sincronização.`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => syncNow()}
          disabled={!isOnline || isSyncing}
          className="relative"
        >
          {isSyncing ? (
            <Loader2 className="animate-spin" />
          ) : !isOnline ? (
            <CloudOff />
          ) : (
            <RefreshCw />
          )}
          {pendingCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]"
            >
              {pendingCount}
            </Badge>
          ) : null}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
