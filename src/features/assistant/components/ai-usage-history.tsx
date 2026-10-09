"use client";

import * as React from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Info, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { formatDate, formatTime } from "@/lib/format";
import { useMyAiUsageQuery } from "@/features/assistant/hooks/use-assistant";
import { useWorkspacesQuery } from "@/features/workspaces/hooks/use-workspaces";
import {
  AI_USAGE_FEATURES,
  type AiUsageFeature,
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
  "assistant-chat": "Assistente",
  "analytics-query": "Perguntas em dashboards",
  "content-safety": "Verificação de segurança",
};

// Plain-language hints for the terms that aren't self-explanatory. `cached`
// is already inside `promptTokens`; `thoughts` is not inside `outputTokens`
// (see AiUsageTokens).
const HINTS = {
  contentSafety:
    "Uma checagem automática que o assistente faz no conteúdo da conversa antes de responder. Ela também usa a IA, então gasta tokens e conta para o limite do plano.",
  cached:
    "Parte da entrada que a IA já tinha lido há pouco e reaproveitou. Esse número já está incluído em Entrada, não é um gasto a mais.",
  thoughts:
    "Tokens que a IA usou para pensar antes de responder. Não aparecem no texto da resposta, mas contam no total.",
} as const;

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
          {/* `summary`/`byFeature` aggregate the whole from–to range; `items`
              is only one page of it (API.md § 24). */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Totais do período inteiro escolhido acima, somando todas as páginas.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <SummaryCard label="Total de tokens" value={usage.summary.totalTokens} />
              <SummaryCard label="Chamadas" value={usage.summary.calls} />
              <SummaryCard
                label="Entrada"
                value={usage.summary.promptTokens}
                hint={`${formatTokens(usage.summary.cachedTokens)} reaproveitados`}
                tooltip={HINTS.cached}
              />
              <SummaryCard label="Saída" value={usage.summary.outputTokens} />
              <SummaryCard
                label="Raciocínio"
                value={usage.summary.thoughtsTokens}
                tooltip={HINTS.thoughts}
              />
            </div>

            {usage.byFeature.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {usage.byFeature.map((item) => (
                  <Badge key={item.feature} variant="secondary">
                    <FeatureLabel feature={item.feature} />:{" "}
                    {formatTokens(item.totalTokens)} tokens · {formatTokens(item.calls)}{" "}
                    {item.calls === 1 ? "chamada" : "chamadas"}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Cada uso, do mais recente</h3>
            <p className="text-xs text-muted-foreground">
              A lista é dividida em páginas. Para saber o total, use os números acima — somar só
              esta página dá um valor menor.
            </p>
          </div>

          <Card className="gap-0 overflow-hidden p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 text-xs text-muted-foreground">Quando</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Origem</TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    <HeadWithHint label="Entrada" hint={HINTS.cached} />
                  </TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">Saída</TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">
                    <HeadWithHint label="Raciocínio" hint={HINTS.thoughts} />
                  </TableHead>
                  <TableHead className="pr-4 text-right text-xs text-muted-foreground">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="py-3 pl-4">
                      <p>{formatDate(item.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(item.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell className="py-3">
                      <p className="font-medium">
                        <FeatureLabel feature={item.feature} />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.workspaceId ? `${workspaceLabel(item.workspaceId)} · ` : null}
                        {item.model}
                      </p>
                    </TableCell>
                    <TableCell className="py-3 text-right tabular-nums">
                      <p>{formatTokens(item.promptTokens)}</p>
                      {item.cachedTokens > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {formatTokens(item.cachedTokens)} reaproveitados
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-3 text-right tabular-nums">
                      {formatTokens(item.outputTokens)}
                    </TableCell>
                    <TableCell className="py-3 text-right tabular-nums">
                      {item.thoughtsTokens > 0 ? (
                        formatTokens(item.thoughtsTokens)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 pr-4 text-right font-semibold tabular-nums">
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

function InfoHint({ text, label }: { text: string; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`O que é ${label}?`}
          className="inline-flex text-muted-foreground hover:text-foreground"
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

function FeatureLabel({ feature }: { feature: AiUsageFeature }) {
  const label = FEATURE_LABELS[feature] ?? feature;
  if (feature !== "content-safety") return <>{label}</>;
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <InfoHint text={HINTS.contentSafety} label={label} />
    </span>
  );
}

function HeadWithHint({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="inline-flex items-center justify-end gap-1">
      {label}
      <InfoHint text={hint} label={label} />
    </span>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tooltip,
}: {
  label: string;
  value: number;
  hint?: string;
  tooltip?: string;
}) {
  return (
    <Card className="gap-1 p-4">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        {tooltip ? <InfoHint text={tooltip} label={label} /> : null}
      </p>
      <p className="text-xl font-semibold tabular-nums text-foreground">{formatTokens(value)}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
