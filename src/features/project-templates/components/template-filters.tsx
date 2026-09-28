"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { getCategoryInfo } from "@/features/project-templates/lib/categories";
import type { TemplateUrlFilters } from "@/features/project-templates/hooks/use-template-url-filters";
import {
  PROJECT_TEMPLATE_CATEGORIES,
  type ProjectTemplateCategoryInfo,
} from "@/types/project-template";

const SEARCH_DEBOUNCE_MS = 350;

interface TemplateFiltersProps {
  filters: TemplateUrlFilters;
  setFilters: (patch: Partial<TemplateUrlFilters>, options?: { replace?: boolean }) => void;
  categories?: ProjectTemplateCategoryInfo[];
  // Per-category counts only describe the hub (PUBLISHED); the admin table
  // hides them since it also lists other statuses.
  showCategoryCounts?: boolean;
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
        placeholder="Buscar por nome ou descrição"
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

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: { value: T | undefined; label: string }[];
  onChange: (value: T | undefined) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-border p-0.5">
      {options.map((option) => (
        <Button
          key={option.label}
          type="button"
          size="sm"
          variant={option.value === value ? "secondary" : "ghost"}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function TemplateFilters({
  filters,
  setFilters,
  categories,
  showCategoryCounts = true,
  extra,
}: TemplateFiltersProps) {
  const onSearch = React.useCallback(
    (search: string) => setFilters({ search: search || undefined }, { replace: true }),
    [setFilters]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchBox value={filters.search ?? ""} onDebouncedChange={onSearch} />
        <Segmented
          label="Preço"
          value={filters.pricing}
          onChange={(pricing) => setFilters({ pricing })}
          options={[
            { value: undefined, label: "Todos os preços" },
            { value: "free", label: "Grátis" },
            { value: "paid", label: "Pagos" },
          ]}
        />
        <Segmented
          label="Origem"
          value={filters.origin}
          onChange={(origin) => setFilters({ origin })}
          options={[
            { value: undefined, label: "Todas as origens" },
            { value: "system", label: "TaskFlow" },
            { value: "community", label: "Comunidade" },
          ]}
        />
        {extra}
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Categoria">
        <Chip active={!filters.category} onClick={() => setFilters({ category: undefined })}>
          Todas as categorias
        </Chip>
        {PROJECT_TEMPLATE_CATEGORIES.map((slug) => {
          const info = getCategoryInfo(slug, categories);
          const count = categories?.find((category) => category.slug === slug)?.templateCount;
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
              {showCategoryCounts && count !== undefined ? (
                <span className="tabular-nums opacity-70">{count}</span>
              ) : null}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
