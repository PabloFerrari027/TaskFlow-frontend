"use client";

import { Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDashboardPagesQuery } from "@/features/dashboard-pages/hooks/use-dashboard-pages";
import type { TemplateSnapshotOptions } from "@/types/folder-template";

export interface SnapshotOptionsValue {
  includeItems: boolean;
  keepItemStatus: boolean;
  includeSubfolders: boolean;
  includeRecurrences: boolean;
  includeAutomations: boolean;
  dashboardPageIds: string[];
  guide: string;
}

export const DEFAULT_SNAPSHOT_OPTIONS: SnapshotOptionsValue = {
  includeItems: true,
  keepItemStatus: false,
  includeSubfolders: false,
  includeRecurrences: true,
  includeAutomations: true,
  dashboardPageIds: [],
  guide: "",
};

const MAX_DASHBOARDS = 5;

export function toSnapshotRequest(value: SnapshotOptionsValue): TemplateSnapshotOptions {
  const guide = value.guide.trim();
  return {
    includeItems: value.includeItems,
    keepItemStatus: value.includeItems && value.keepItemStatus,
    includeSubfolders: value.includeSubfolders,
    includeRecurrences: value.includeRecurrences,
    includeAutomations: value.includeAutomations,
    dashboardPageIds: value.dashboardPageIds.length > 0 ? value.dashboardPageIds : undefined,
    extras: guide ? { guide } : undefined,
  };
}

type BooleanKey = Exclude<keyof SnapshotOptionsValue, "dashboardPageIds" | "guide">;

const OPTIONS: { key: BooleanKey; label: string; hint: string; needsItems?: boolean }[] = [
  {
    key: "includeItems",
    label: "Os itens",
    hint: "Com subitens, prioridade, campos extras, marcos, estimativas e dependências. Prazos viram “X dias depois de criar”. Responsáveis, comentários e anexos não vão.",
  },
  {
    key: "keepItemStatus",
    label: "Manter a etapa de cada item",
    hint: "Sem isto, todas voltam para “A fazer”.",
    needsItems: true,
  },
  {
    key: "includeSubfolders",
    label: "As subpastas",
    hint: "As subpastas diretas, com a mesma leitura.",
  },
  {
    key: "includeRecurrences",
    label: "Os itens repetidos",
    hint: "As que estão ligadas, sem o responsável. O fuso é escolhido de novo ao usar o modelo.",
  },
  {
    key: "includeAutomations",
    label: "As automações desta pasta",
    hint: "As regras que agem só nesta pasta e não dependem de pessoas específicas.",
  },
];

/** What a template reads from its source folder (API.md § 26.6). */
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
          const disabled = option.needsItems && !value.includeItems;
          return (
            <label
              key={option.key}
              className={option.needsItems ? "ml-6 flex items-start gap-2" : "flex items-start gap-2"}
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
            Os gráficos de itens destas páginas vão junto (até {MAX_DASHBOARDS}).
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
          placeholder="Explique como usar a pasta. Vira o primeiro item, “Comece por aqui”. Aceita Markdown."
          value={value.guide}
          onChange={(event) => onChange({ ...value, guide: event.target.value })}
        />
      </div>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <X className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
        Nunca vão comentários, anexos nem as pessoas da pasta. O modelo é uma cópia congelada:
        mudar a pasta depois não muda o modelo (até você publicar uma versão nova).
      </p>
    </div>
  );
}
