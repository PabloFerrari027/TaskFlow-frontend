"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { getCategoryInfo } from "@/features/project-templates/lib/categories";
import { isWorkspaceTemplate, plural } from "@/features/project-templates/lib/template-labels";
import {
  useProjectTemplateCategoriesQuery,
  useProjectTemplatesQuery,
  useWorkspaceProjectTemplatesQuery,
} from "@/features/project-templates/hooks/use-project-templates";
import type {
  ProjectTemplateCategoryInfo,
  ProjectTemplateSummary,
} from "@/types/project-template";

const SUGGESTION_COUNT = 8;
const SEARCH_DELAY_MS = 350;
const MIN_SEARCH_LENGTH = 3;

// Shorter than `formatTemplateCounts` — a suggestion tile has room for one line.
function formatShortCounts(template: ProjectTemplateSummary) {
  const parts = [plural(template.sectionCount, "coluna", "colunas")];
  if (template.taskCount > 0) parts.push(plural(template.taskCount, "tarefa", "tarefas"));
  return parts.join(" · ");
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function SuggestionTile({
  template,
  categories,
  selected,
  onSelect,
}: {
  template: ProjectTemplateSummary;
  categories?: ProjectTemplateCategoryInfo[];
  selected: boolean;
  onSelect: (template: ProjectTemplateSummary) => void;
}) {
  const category = getCategoryInfo(template.category, categories);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(template)}
      className={cn(
        "group flex min-h-36 w-full min-w-0 flex-col rounded-xl border bg-card p-3.5 text-left transition-all outline-none",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50",
        selected && "border-primary bg-primary/5 ring-1 ring-primary"
      )}
      title={template.description ?? template.name}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden
          className={cn(
            "flex size-10 items-center justify-center rounded-lg text-xl transition-transform group-hover:scale-110",
            selected ? "bg-primary/15" : "bg-muted"
          )}
        >
          {category.icon}
        </span>
        {selected ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : isWorkspaceTemplate(template) ? (
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            Do workspace
          </span>
        ) : null}
      </div>
      <p className="mt-3 line-clamp-1 text-sm leading-snug font-medium">{template.name}</p>
      {template.description ? (
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
          {template.description}
        </p>
      ) : null}
      <p className="mt-auto pt-2 text-[11px] text-muted-foreground/80">
        {formatShortCounts(template)}
      </p>
    </button>
  );
}

interface TemplateSuggestionsProps {
  workspaceId: string;
  // What the user typed as the project name — steers the suggestions.
  query: string;
  selectedId: string | null;
  onSelect: (template: ProjectTemplateSummary) => void;
  // Called before leaving the dialog for the templates page.
  onNavigate: () => void;
}

export function TemplateSuggestions({
  workspaceId,
  query,
  selectedId,
  onSelect,
  onNavigate,
}: TemplateSuggestionsProps) {
  const trimmed = query.trim();
  const debounced = useDebouncedValue(
    trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : "",
    SEARCH_DELAY_MS
  );
  const categoriesQuery = useProjectTemplateCategoriesQuery();
  const workspaceQuery = useWorkspaceProjectTemplatesQuery(workspaceId);
  const defaultQuery = useProjectTemplatesQuery({ page: 1, limit: SUGGESTION_COUNT });
  // With no search this is the same key as `defaultQuery`, so no extra request.
  const searchQuery = useProjectTemplatesQuery({
    page: 1,
    limit: SUGGESTION_COUNT,
    search: debounced || undefined,
  });

  // The workspace's own templates come first. They are few and all loaded,
  // so the search over them runs here instead of on the server.
  const workspaceTemplates = workspaceQuery.data ?? [];
  const workspaceMatches = debounced
    ? workspaceTemplates.filter((template) =>
        normalize(template.name).includes(normalize(debounced))
      )
    : [];
  const systemMatches =
    debounced && !searchQuery.isPlaceholderData ? (searchQuery.data?.data ?? []) : [];
  const isMatch = workspaceMatches.length + systemMatches.length > 0;
  const templates = isMatch
    ? [...workspaceMatches, ...systemMatches]
    : [...workspaceTemplates, ...(defaultQuery.data?.data ?? [])];

  const isLoading = defaultQuery.isLoading || workspaceQuery.isLoading;

  // Nothing to suggest (or it failed): the dialog works fine without this.
  if (!isLoading && templates.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="size-4 text-primary" />
          {isMatch ? (
            <span>
              Modelos para <span className="text-primary">“{debounced}”</span>
            </span>
          ) : (
            "Comece com um modelo pronto"
          )}
        </p>
        <Link
          href="/templates"
          onClick={onNavigate}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          Ver todos <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-4">
        {isLoading
          ? Array.from({ length: SUGGESTION_COUNT }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))
          : templates.slice(0, SUGGESTION_COUNT).map((template) => (
              <SuggestionTile
                key={template.id}
                template={template}
                categories={categoriesQuery.data}
                selected={template.id === selectedId}
                onSelect={onSelect}
              />
            ))}
      </div>
    </div>
  );
}
