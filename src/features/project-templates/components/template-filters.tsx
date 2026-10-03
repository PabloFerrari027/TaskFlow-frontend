"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEMPLATE_LEVEL_LABEL } from "@/features/project-templates/lib/template-labels";
import { TEMPLATE_SORTS } from "@/features/project-templates/hooks/use-template-url-filters";
import { cn } from "@/lib/utils";
import { getCategoryInfo } from "@/features/project-templates/lib/categories";
import type { TemplateUrlFilters } from "@/features/project-templates/hooks/use-template-url-filters";
import {
  PROJECT_TEMPLATE_CATEGORIES,
  PROJECT_TEMPLATE_LEVELS,
  type ProjectTemplateCategoryInfo,
  type ProjectTemplateLevel,
  type ProjectTemplateSort,
} from "@/types/project-template";

const SORT_LABEL: Record<ProjectTemplateSort, string> = {
  featured: "Destaques",
  popular: "Mais usados",
  newest: "Mais recentes",
  relevance: "Mais relevantes",
};

const ANY_LEVEL = "__any__";

const SEARCH_DEBOUNCE_MS = 350;

interface TemplateFiltersProps {
  filters: TemplateUrlFilters;
  setFilters: (patch: Partial<TemplateUrlFilters>, options?: { replace?: boolean }) => void;
  categories?: ProjectTemplateCategoryInfo[];
  extra?: React.ReactNode;
}

function SearchBox({
  value,
  onDebouncedChange,
}: {
  value: string;
  onDebouncedChange: (value: string) => void;
}) {
  const [input, setInput] = React.useState(value);
  // What this box itself last sent to the URL. When the URL's value changes
  // to something else (back button, "Limpar filtros"), that's an outside
  // change and the box follows it; when it's our own echo, it doesn't — so
  // a URL update landing mid-typing never eats the newest keystrokes.
  const [lastSent, setLastSent] = React.useState(value);
  const [seenValue, setSeenValue] = React.useState(value);

  if (value !== seenValue) {
    setSeenValue(value);
    if (value !== lastSent) {
      setInput(value);
      setLastSent(value);
    }
  }

  React.useEffect(() => {
    const trimmed = input.trim().slice(0, 100);
    if (trimmed === value) return;
    const timer = setTimeout(() => {
      setLastSent(trimmed);
      onDebouncedChange(trimmed);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input, value, onDebouncedChange]);

  return (
    <InputGroup className="sm:max-w-sm">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        placeholder="Buscar por nome, descrição ou tag"
        aria-label="Buscar modelos"
        maxLength={100}
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
    </InputGroup>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function TemplateFilters({ filters, setFilters, categories, extra }: TemplateFiltersProps) {
  const onSearch = React.useCallback(
    (search: string) => setFilters({ search: search || undefined }, { replace: true }),
    [setFilters]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchBox value={filters.search ?? ""} onDebouncedChange={onSearch} />
        <Select
          value={filters.level ?? ANY_LEVEL}
          onValueChange={(value) =>
            setFilters({ level: value === ANY_LEVEL ? undefined : (value as ProjectTemplateLevel) })
          }
        >
          <SelectTrigger aria-label="Nível" className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY_LEVEL}>Qualquer nível</SelectItem>
            {PROJECT_TEMPLATE_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {TEMPLATE_LEVEL_LABEL[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* While searching the API orders by relevance unless told otherwise. */}
        <Select
          value={filters.sort ?? (filters.search ? "relevance" : "featured")}
          onValueChange={(value) =>
            setFilters({ sort: value === "relevance" ? undefined : (value as ProjectTemplateSort) })
          }
        >
          <SelectTrigger aria-label="Ordenar" className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filters.search ? <SelectItem value="relevance">{SORT_LABEL.relevance}</SelectItem> : null}
            {TEMPLATE_SORTS.map((sort) => (
              <SelectItem key={sort} value={sort}>
                {SORT_LABEL[sort]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {extra}
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Categoria">
        <Chip active={!filters.category} onClick={() => setFilters({ category: undefined })}>
          Todas as categorias
        </Chip>
        {PROJECT_TEMPLATE_CATEGORIES.map((slug) => {
          const info = getCategoryInfo(slug, categories);
          return (
            <Chip
              key={slug}
              active={filters.category === slug}
              onClick={() =>
                setFilters({ category: filters.category === slug ? undefined : slug })
              }
            >
              <span aria-hidden>{info.icon}</span>
              {info.label}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
