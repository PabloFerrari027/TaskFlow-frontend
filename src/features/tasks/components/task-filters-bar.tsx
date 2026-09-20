"use client";

import * as React from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL } from "@/components/shared/status-badge";
import { useAssignableMembers } from "@/features/tasks/hooks/use-assignable-members";
import {
  countAdvancedFilters,
  type DuePreset,
  type TaskFilters,
  type TaskKind,
  type TriState,
} from "@/features/tasks/lib/task-filters";
import { NO_PRIORITY_VALUE, UNASSIGNED_VALUE } from "@/features/tasks/schemas";
import { useAuth } from "@/lib/auth/auth-context";
import { shortenId } from "@/lib/format";
import type { TaskPriority, TaskStatus } from "@/types/task";

interface Option<T extends string> {
  value: T;
  label: string;
}

const STATUS_OPTIONS = (Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((value) => ({
  value,
  label: TASK_STATUS_LABEL[value],
}));

const PRIORITY_OPTIONS: Array<Option<TaskPriority | typeof NO_PRIORITY_VALUE>> = [
  ...(Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[]).map((value) => ({
    value,
    label: TASK_PRIORITY_LABEL[value],
  })),
  { value: NO_PRIORITY_VALUE, label: "Sem prioridade" },
];

const DUE_OPTIONS: Array<Option<DuePreset>> = [
  { value: "any", label: "Qualquer prazo" },
  { value: "overdue", label: "Atrasadas (não concluídas)" },
  { value: "today", label: "Vencem hoje" },
  { value: "next7", label: "Próximos 7 dias" },
  { value: "none", label: "Sem prazo" },
];

const ATTACHMENT_OPTIONS: Array<Option<TriState>> = [
  { value: "any", label: "Tanto faz" },
  { value: "yes", label: "Com anexos" },
  { value: "no", label: "Sem anexos" },
];

const DESCRIPTION_OPTIONS: Array<Option<TriState>> = [
  { value: "any", label: "Tanto faz" },
  { value: "yes", label: "Com descrição" },
  { value: "no", label: "Sem descrição" },
];

const KIND_OPTIONS: Array<Option<TaskKind>> = [
  { value: "any", label: "Tarefas e subtarefas" },
  { value: "tasks", label: "Só tarefas" },
  { value: "subtasks", label: "Só subtarefas" },
];

// A Radix Select can't hold an empty value, so "anyone" needs a stand-in.
const ANYONE = "__anyone__";

function TriggerLabel({ label, count }: { label: string; count: number }) {
  return (
    <>
      {label}
      {count > 0 ? (
        <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[0.65rem]">
          {count}
        </Badge>
      ) : null}
      <ChevronDown />
    </>
  );
}

function MultiSelectFilter<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Array<Option<T>>;
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={selected.length > 0 ? "secondary" : "outline"} size="sm">
          <TriggerLabel label={label} count={selected.length} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 min-w-48">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            // Keep the menu open so several options can be ticked in one go.
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) =>
              onChange(
                checked
                  ? [...selected, option.value]
                  : selected.filter((value) => value !== option.value)
              )
            }
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange([])}>Limpar seleção</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SingleSelectFilter<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<Option<T>>;
  value: T;
  onChange: (next: T) => void;
}) {
  const isActive = value !== options[0].value;
  const current = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={isActive ? "secondary" : "outline"} size="sm">
          {isActive && current ? current.label : label}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as T)}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function OptionSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<Option<T>>;
  onChange: (next: T) => void;
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger size="sm" className="w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function DateRangeField({
  label,
  from,
  to,
  onChange,
}: {
  label: string;
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          aria-label={`${label}: de`}
          value={from}
          max={to || undefined}
          onChange={(e) => onChange({ from: e.target.value, to })}
          className="h-7 px-2 text-xs"
        />
        <span className="text-xs text-muted-foreground">até</span>
        <Input
          type="date"
          aria-label={`${label}: até`}
          value={to}
          min={from || undefined}
          onChange={(e) => onChange({ from, to: e.target.value })}
          className="h-7 px-2 text-xs"
        />
      </div>
    </Field>
  );
}

/**
 * Filter controls for the task lists. The API only paginates (no filter
 * params), so these narrow what each column has loaded — the parent applies
 * `applyTaskFilters` to every column with the same state.
 */
export function TaskFiltersBar({
  projectId,
  filters,
  onChange,
  onReset,
  activeCount,
}: {
  projectId: string;
  filters: TaskFilters;
  onChange: (patch: Partial<TaskFilters>) => void;
  onReset: () => void;
  activeCount: number;
}) {
  const { userId: currentUserId } = useAuth();
  const { userIds } = useAssignableMembers(projectId);

  // The current user first; other members only have an id to show.
  const memberOptions = React.useMemo<Array<Option<string>>>(() => {
    const sorted = [...userIds].sort((a, b) =>
      a === currentUserId ? -1 : b === currentUserId ? 1 : 0
    );
    return sorted.map((userId) => ({
      value: userId,
      label: userId === currentUserId ? "Você" : `Usuário ${shortenId(userId)}…`,
    }));
  }, [userIds, currentUserId]);

  const assigneeOptions = React.useMemo(
    () => [{ value: UNASSIGNED_VALUE, label: "Sem responsável" }, ...memberOptions],
    [memberOptions]
  );
  const personOptions = React.useMemo(
    () => [{ value: ANYONE, label: "Qualquer pessoa" }, ...memberOptions],
    [memberOptions]
  );

  const advancedCount = countAdvancedFilters(filters);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Buscar tarefas"
          placeholder="Buscar por título ou descrição"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="h-7 pl-8 text-[0.8rem]"
        />
      </div>

      <MultiSelectFilter
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.statuses}
        onChange={(statuses) => onChange({ statuses })}
      />
      <MultiSelectFilter
        label="Prioridade"
        options={PRIORITY_OPTIONS}
        selected={filters.priorities}
        onChange={(priorities) => onChange({ priorities })}
      />
      <MultiSelectFilter
        label="Responsável"
        options={assigneeOptions}
        selected={filters.assignees}
        onChange={(assignees) => onChange({ assignees })}
      />
      <SingleSelectFilter
        label="Prazo"
        options={DUE_OPTIONS}
        value={filters.due}
        onChange={(due) => onChange({ due })}
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant={advancedCount > 0 ? "secondary" : "outline"} size="sm">
            <SlidersHorizontal />
            Mais filtros
            {advancedCount > 0 ? (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[0.65rem]">
                {advancedCount}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="max-h-[70vh] w-96 max-w-[90vw] overflow-y-auto">
          <DateRangeField
            label="Prazo entre"
            from={filters.dueFrom}
            to={filters.dueTo}
            onChange={({ from, to }) => onChange({ dueFrom: from, dueTo: to })}
          />
          <DateRangeField
            label="Criada entre"
            from={filters.createdFrom}
            to={filters.createdTo}
            onChange={({ from, to }) => onChange({ createdFrom: from, createdTo: to })}
          />
          <DateRangeField
            label="Atualizada entre"
            from={filters.updatedFrom}
            to={filters.updatedTo}
            onChange={({ from, to }) => onChange({ updatedFrom: from, updatedTo: to })}
          />
          <OptionSelect
            label="Participante"
            value={filters.participantId || ANYONE}
            options={personOptions}
            onChange={(next) => onChange({ participantId: next === ANYONE ? "" : next })}
          />
          <OptionSelect
            label="Mencionado(a) na descrição"
            value={filters.mentionedId || ANYONE}
            options={personOptions}
            onChange={(next) => onChange({ mentionedId: next === ANYONE ? "" : next })}
          />
          <OptionSelect
            label="Criada por"
            value={filters.createdBy || ANYONE}
            options={personOptions}
            onChange={(next) => onChange({ createdBy: next === ANYONE ? "" : next })}
          />
          <OptionSelect
            label="Anexos"
            value={filters.attachments}
            options={ATTACHMENT_OPTIONS}
            onChange={(attachments) => onChange({ attachments })}
          />
          <OptionSelect
            label="Descrição"
            value={filters.description}
            options={DESCRIPTION_OPTIONS}
            onChange={(description) => onChange({ description })}
          />
          <OptionSelect
            label="Tipo"
            value={filters.kind}
            options={KIND_OPTIONS}
            onChange={(kind) => onChange({ kind })}
          />
        </PopoverContent>
      </Popover>

      {activeCount > 0 ? (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X /> Limpar filtros ({activeCount})
        </Button>
      ) : null}
    </div>
  );
}
