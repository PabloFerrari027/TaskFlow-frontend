"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Lock, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatPriceCents } from "@/lib/format";
import { getCategoryInfo } from "@/features/project-templates/lib/categories";
import { plural } from "@/features/project-templates/lib/template-labels";
import {
  useProjectTemplateCategoriesQuery,
  useProjectTemplatesQuery,
} from "@/features/project-templates/hooks/use-project-templates";
import type {
  ProjectTemplateCategoryInfo,
  ProjectTemplateSummary,
} from "@/types/project-template";

const SUGGESTION_COUNT = 8;
const SEARCH_DELAY_MS = 350;
const MIN_SEARCH_LENGTH = 3;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Shorter than `formatTemplateCounts` — a suggestion tile has room for one line.
function formatShortCounts(template: ProjectTemplateSummary) {
  const parts = [plural(template.sectionCount, "coluna", "colunas")];
  if (template.taskCount > 0) parts.push(plural(template.taskCount, "tarefa", "tarefas"));
  return parts.join(" · ");
}

function SuggestionTile({
  template,
  categories,
  selected,
  onSelect,
  onNavigate,
}: {
  template: ProjectTemplateSummary;
  categories?: ProjectTemplateCategoryInfo[];
  selected: boolean;
  onSelect: (template: ProjectTemplateSummary) => void;
  onNavigate: () => void;
}) {
  const category = getCategoryInfo(template.category, categories);
  const isPaid = template.priceCents > 0;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden
          className={cn(
            "flex size-9 items-center justify-center rounded-lg text-lg transition-transform group-hover:scale-110",
            selected ? "bg-primary/15" : "bg-muted"
          )}
        >
          {category.icon}
        </span>
        {selected ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : isPaid ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
            <Lock className="size-2.5" /> {formatPriceCents(template.priceCents)}
          </span>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-snug font-medium">{template.name}</p>
      <p className="mt-auto pt-1 text-[11px] text-muted-foreground">{formatShortCounts(template)}</p>
    </>
  );

  const className = cn(
    "group flex h-32 w-40 shrink-0 snap-start flex-col rounded-xl border bg-card p-3 text-left transition-all outline-none",
    "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/50",
    selected && "border-primary bg-primary/5 ring-1 ring-primary"
  );

  // A paid template may still need buying — its page handles both cases.
  if (isPaid) {
    return (
      <Link
        href={`/templates/${template.id}`}
        onClick={onNavigate}
        className={className}
        title={`${template.name} — ver detalhes`}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(template)}
      className={className}
      title={template.description ?? template.name}
    >
      {body}
    </button>
  );
}

interface TemplateSuggestionsProps {
  // What the user typed as the project name — steers the suggestions.
  query: string;
  selectedId: string | null;
  onSelect: (template: ProjectTemplateSummary) => void;
  // Called before leaving the dialog for a template's page or the hub.
  onNavigate: () => void;
}

export function TemplateSuggestions({
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
  const defaultQuery = useProjectTemplatesQuery({ page: 1, limit: SUGGESTION_COUNT });
  // With no search this is the same key as `defaultQuery`, so no extra request.
  const searchQuery = useProjectTemplatesQuery({
    page: 1,
    limit: SUGGESTION_COUNT,
    search: debounced || undefined,
  });

  const matches = debounced && !searchQuery.isPlaceholderData ? (searchQuery.data?.data ?? []) : [];
  const isMatch = matches.length > 0;
  const templates = isMatch ? matches : (defaultQuery.data?.data ?? []);

  // Nothing in the hub (or it failed): the dialog works fine without this.
  if (!defaultQuery.isLoading && templates.length === 0) return null;

  return (
    <div className="space-y-2">
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

      {/* Bleeds to the dialog edges so the row reads as scrollable. */}
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pt-0.5 pb-2 [scrollbar-width:thin]">
        {defaultQuery.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-40 shrink-0 rounded-xl" />
            ))
          : templates.map((template) => (
              <SuggestionTile
                key={template.id}
                template={template}
                categories={categoriesQuery.data}
                selected={template.id === selectedId}
                onSelect={onSelect}
                onNavigate={onNavigate}
              />
            ))}
      </div>
    </div>
  );
}
