"use client";

import { Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDashboardPagesQuery } from "@/features/dashboard-pages/hooks/use-dashboard-pages";
import type { TemplateSnapshotOptions } from "@/types/project-template";

export interface SnapshotOptionsValue {
  includeTasks: boolean;
  keepTaskStatus: boolean;
  includeSubprojects: boolean;
  includeRecurrences: boolean;
  includeAutomations: boolean;
  dashboardPageIds: string[];
  guide: string;
}

export const DEFAULT_SNAPSHOT_OPTIONS: SnapshotOptionsValue = {
  includeTasks: true,
  keepTaskStatus: false,
  includeSubprojects: false,
  includeRecurrences: true,
  includeAutomations: true,
  dashboardPageIds: [],
  guide: "",
};

const MAX_DASHBOARDS = 5;

export function toSnapshotRequest(value: SnapshotOptionsValue): TemplateSnapshotOptions {
  const guide = value.guide.trim();
  return {
    includeTasks: value.includeTasks,
    keepTaskStatus: value.includeTasks && value.keepTaskStatus,
    includeSubprojects: value.includeSubprojects,
    includeRecurrences: value.includeRecurrences,
    includeAutomations: value.includeAutomations,
    dashboardPageIds: value.dashboardPageIds.length > 0 ? value.dashboardPageIds : undefined,
    extras: guide ? { guide } : undefined,
  };
}

type BooleanKey = Exclude<keyof SnapshotOptionsValue, "dashboardPageIds" | "guide">;

const OPTIONS: { key: BooleanKey; label: string; hint: string; needsTasks?: boolean }[] = [
  {
    key: "includeTasks",
    label: "As tarefas",
    hint: "Com subtarefas, prioridade, campos extras, marcos, estimativas e dependências. Prazos viram “X dias depois de criar”. Responsáveis, comentários e anexos não vão.",
  },
  {
    key: "keepTaskStatus",
    label: "Manter a etapa de cada tarefa",
    hint: "Sem isto, todas voltam para “A fazer”.",
    needsTasks: true,
  },
  {
    key: "includeSubprojects",
    label: "Os subprojetos",
    hint: "Os subprojetos diretos, com a mesma leitura.",
  },
  {
    key: "includeRecurrences",
    label: "As tarefas repetidas",
    hint: "As que estão ligadas, sem o responsável. O fuso é escolhido de novo ao usar o modelo.",
  },
  {
    key: "includeAutomations",
    label: "As automações deste projeto",
    hint: "As regras que agem só neste projeto e não dependem de pessoas específicas.",
  },
];

/** What a template reads from its source project (API.md § 26.6). */
export function SnapshotOptionsFields({
  workspaceId,
  value,
  onChange,
}: {
  workspaceId: string;
  value: SnapshotOptionsValue;
  onChange: (value: SnapshotOptionsValue) => void;
}) {
  const pagesQuery = useDashboardPagesQuery(workspaceId);
  const pages = pagesQuery.data ?? [];

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
      <p className="flex items-start gap-1.5 text-muted-foreground">
        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
        Sempre vão as colunas (com as subcolunas), os campos extras, as etapas, os formulários e as
        visões compartilhadas.
      </p>
      <div className="space-y-2">
        <p className="font-medium text-foreground">Levar também</p>
        {OPTIONS.map((option) => {
          const disabled = option.needsTasks && !value.includeTasks;
          return (
            <label
              key={option.key}
              className={option.needsTasks ? "ml-6 flex items-start gap-2" : "flex items-start gap-2"}
            >
              <Checkbox
                className="mt-0.5"
                disabled={disabled}
                checked={value[option.key] && !disabled}
                onCheckedChange={(checked) => onChange({ ...value, [option.key]: checked === true })}
              />
              <span className={disabled ? "opacity-50" : undefined}>
                <span className="block text-foreground">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </label>
          );
        })}
      </div>

      {pages.length > 0 ? (
        <div className="space-y-2">
          <p className="font-medium text-foreground">Painéis</p>
          <p className="text-xs text-muted-foreground">
            Os gráficos de tarefas destas páginas vão junto (até {MAX_DASHBOARDS}).
          </p>
          {pages.map((page) => {
            const checked = value.dashboardPageIds.includes(page.id);
            const full = !checked && value.dashboardPageIds.length >= MAX_DASHBOARDS;
            return (
              <label key={page.id} className="flex items-center gap-2">
                <Checkbox
                  checked={checked}
                  disabled={full}
                  onCheckedChange={(next) =>
                    onChange({
                      ...value,
                      dashboardPageIds: next
                        ? [...value.dashboardPageIds, page.id]
                        : value.dashboardPageIds.filter((id) => id !== page.id),
                    })
                  }
                />
                <span className={full ? "text-muted-foreground" : "text-foreground"}>{page.name}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="snapshot-guide" className="font-medium">
          Guia de uso (opcional)
        </Label>
        <Textarea
          id="snapshot-guide"
          rows={3}
          placeholder="Explique como usar o projeto. Vira a primeira tarefa, “Comece por aqui”. Aceita Markdown."
          value={value.guide}
          onChange={(event) => onChange({ ...value, guide: event.target.value })}
        />
      </div>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <X className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
        Nunca vão comentários, anexos nem as pessoas do projeto. O modelo é uma cópia congelada:
        mudar o projeto depois não muda o modelo (até você publicar uma versão nova).
      </p>
    </div>
  );
}
