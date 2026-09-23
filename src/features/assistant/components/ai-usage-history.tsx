"use client";

import * as React from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Pager } from "@/components/shared/pager";
import { formatDateTime } from "@/lib/format";
import { useMyAiUsageQuery } from "@/features/assistant/hooks/use-assistant";
import { useWorkspacesQuery } from "@/features/workspaces/hooks/use-workspaces";
import {
  AI_USAGE_FEATURES,
  type AiUsageFeature,
  type AiUsageOperation,
  type AiUsageResponse,
} from "@/types/ai-usage";

type UseAiUsageQuery = (params: {
  days: number;
  feature?: AiUsageFeature;
  page: number;
}) => UseQueryResult<AiUsageResponse>;

const PERIOD_OPTIONS = [
  { days: 7, label: "Últimos 7 dias" },
  { days: 30, label: "Últimos 30 dias" },
  { days: 90, label: "Últimos 90 dias" },
] as const;

const FEATURE_LABELS: Record<AiUsageFeature, string> = {
  "assistant-chat": "Chat do assistente",
  "content-safety": "Verificação de segurança",
  "analytics-query": "Consulta de análises",
};

const OPERATION_LABELS: Record<AiUsageOperation, string> = {
  converse: "Conversa",
  generateStructured: "Resposta estruturada",
};

const ALL_FEATURES = "all";

const numberFormat = new Intl.NumberFormat("pt-BR");
const formatTokens = (value: number) => numberFormat.format(value);

// `useUsageQuery` defaults to the caller's own history (`GET /ai-usage/me`).
// The admin client-detail screen passes a thin wrapper around
// `useClientAiUsageQuery` instead, pointed at `GET /admin/ai-usage/users/:userId`
// (API.md § 24) — same response shape/params, different endpoint.
export function AiUsageHistory({
  useUsageQuery = useMyAiUsageQuery,
}: {
  useUsageQuery?: UseAiUsageQuery;
} = {}) {
  const [days, setDays] = React.useState<number>(30);
  const [feature, setFeature] = React.useState<AiUsageFeature | undefined>(undefined);
  const [page, setPage] = React.useState(1);

  const usageQuery = useUsageQuery({ days, feature, page });
  const workspacesQuery = useWorkspacesQuery();

  const workspaceNames = React.useMemo(
    () => new Map((workspacesQuery.data ?? []).map((w) => [w.id, w.name])),
    [workspacesQuery.data]
  );

  // In the admin variant this only resolves workspaces the *admin* also
  // belongs to (there's no endpoint to list another user's workspaces) — a
  // client's own workspace correctly falls back to "Outro workspace".
  function workspaceLabel(workspaceId: string | null) {
    if (!workspaceId) return "—";
    return workspaceNames.get(workspaceId) ?? "Outro workspace";
  }

  const usage = usageQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Select
          value={String(days)}
          onValueChange={(value) => {
            setDays(Number(value));
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Período">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.days} value={String(option.days)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={feature ?? ALL_FEATURES}
          onValueChange={(value) => {
            setFeature(value === ALL_FEATURES ? undefined : (value as AiUsageFeature));
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Origem da chamada">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FEATURES}>Todas as origens</SelectItem>
            {AI_USAGE_FEATURES.map((value) => (
              <SelectItem key={value} value={value}>
                {FEATURE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {usageQuery.isError ? (
        <ErrorState error={usageQuery.error} onRetry={() => usageQuery.refetch()} />
      ) : !usage ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : usage.summary.calls === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title="Nenhum uso de IA no período"
          description="As chamadas ao modelo de IA feitas por você aparecem aqui."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard label="Total de tokens" value={usage.summary.totalTokens} />
            <SummaryCard label="Chamadas" value={usage.summary.calls} />
            <SummaryCard
              label="Entrada"
              value={usage.summary.promptTokens}
              hint={`${formatTokens(usage.summary.cachedTokens)} em cache`}
            />
            <SummaryCard label="Saída" value={usage.summary.outputTokens} />
            <SummaryCard label="Raciocínio" value={usage.summary.thoughtsTokens} />
          </div>

          {usage.byFeature.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {usage.byFeature.map((item) => (
                <Badge key={item.feature} variant="secondary">
                  {FEATURE_LABELS[item.feature] ?? item.feature}:{" "}
                  {formatTokens(item.totalTokens)} tokens · {formatTokens(item.calls)}{" "}
                  {item.calls === 1 ? "chamada" : "chamadas"}
                </Badge>
              ))}
            </div>
          ) : null}

          <Card className="gap-0 p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead className="text-right">Entrada</TableHead>
                  <TableHead className="text-right">Em cache</TableHead>
                  <TableHead className="text-right">Saída</TableHead>
                  <TableHead className="text-right">Raciocínio</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(item.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {FEATURE_LABELS[item.feature] ?? item.feature}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {OPERATION_LABELS[item.operation] ?? item.operation} · {item.model}
                      </p>
                    </TableCell>
                    <TableCell>{workspaceLabel(item.workspaceId)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatTokens(item.promptTokens)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatTokens(item.cachedTokens)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatTokens(item.outputTokens)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatTokens(item.thoughtsTokens)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatTokens(item.totalTokens)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Pager meta={usage.meta} onPageChange={setPage} isLoading={usageQuery.isFetching} />
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card className="gap-1 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-foreground">{formatTokens(value)}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
