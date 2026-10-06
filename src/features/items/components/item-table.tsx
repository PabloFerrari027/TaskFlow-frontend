"use client";

import * as React from "react";
import { Loader2, PanelRightOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ITEM_PRIORITY_LABEL, ItemPriorityBadge } from "@/components/shared/status-badge";
import { ItemStatusSelect } from "@/features/items/components/item-status-select";
import { AssigneeSelect } from "@/features/items/components/assignee-select";
import { useItemSelection } from "@/features/items/context/item-selection-context";
import { ItemTitleCell } from "@/features/items/components/item-inline-text-fields";
import { useItemPanel } from "@/features/items/hooks/use-item-panel";
import {
  useCreateItemMutation,
  useUnassignItemMutation,
  useUpdateItemMutation,
} from "@/features/items/hooks/use-items";
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Item, ItemPriority } from "@/types/item";

// Cells look like plain table text until hovered or focused, like a spreadsheet.
const CELL_TRIGGER_CLASS =
  "w-full border-transparent bg-transparent shadow-none hover:border-input dark:bg-transparent dark:hover:bg-input/30";
const CELL_CLASS = "border-r border-border/60 p-0.5! last:border-r-0";

function StatusCell({ item }: { item: Item }) {
  return (
    <ItemStatusSelect item={item} silent asBadge triggerClassName={CELL_TRIGGER_CLASS} />
  );
}

// Same set-only rule as `ItemPrioritySelect`: the API can't clear a priority,
// so "Sem prioridade" is only a placeholder that goes away once one is chosen.
function PriorityCell({ item }: { item: Item }) {
  const mutation = useUpdateItemMutation(item.id, { silent: true });

  return (
    <Select
      value={item.priority ?? ""}
      disabled={mutation.isPending}
      onValueChange={(next) => mutation.mutate({ priority: next as ItemPriority })}
    >
      <SelectTrigger aria-label="Prioridade do item" className={CELL_TRIGGER_CLASS}>
        <SelectValue placeholder="Sem prioridade">
          {item.priority ? <ItemPriorityBadge priority={item.priority} /> : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(ITEM_PRIORITY_LABEL) as ItemPriority[]).map((priority) => (
          <SelectItem key={priority} value={priority}>
            {ITEM_PRIORITY_LABEL[priority]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// The main assignee only; clearing goes through the dedicated unassign call
// (`useUnassignItemMutation`). Co-assignees are edited in the item panel.
function AssigneeCell({ folderId, item }: { folderId: string; item: Item }) {
  const updateMutation = useUpdateItemMutation(item.id, { silent: true });
  const unassignMutation = useUnassignItemMutation(item.id, { silent: true });
  const isPending = updateMutation.isPending || unassignMutation.isPending;

  return (
    <div className={cn(isPending && "pointer-events-none opacity-60")}>
      <AssigneeSelect
        folderId={folderId}
        value={item.assigneeId ?? undefined}
        triggerClassName={CELL_TRIGGER_CLASS}
        onChange={(next) => {
          if (next === (item.assigneeId ?? undefined)) return;
          if (next) updateMutation.mutate({ assigneeId: next });
          else unassignMutation.mutate();
        }}
      />
    </div>
  );
}

// Set-only like the priority (the API can't clear a due date). Committed on
// blur/Enter rather than on every change: typing a year into a native date
// input fires a valid `change` for each intermediate value.
function DueDateCell({ item }: { item: Item }) {
  const mutation = useUpdateItemMutation(item.id, { silent: true });
  const [draft, setDraft] = React.useState<string | null>(null);
  const serverValue = toDateInputValue(item.dueDate);

  function commit() {
    if (draft && draft !== serverValue) {
      mutation.mutate({ dueDate: fromDateInputValue(draft) });
    }
    setDraft(null);
  }

  return (
    <Input
      type="date"
      aria-label="Prazo do item"
      value={draft ?? serverValue}
      disabled={mutation.isPending}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setDraft(null);
      }}
      className="h-8 border-transparent bg-transparent px-2 shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent"
    />
  );
}

function ItemRow({ folderId, item }: { folderId: string; item: Item }) {
  const { openItem } = useItemPanel();
  const selection = useItemSelection();
  const isSelected = selection.isSelected(item.id);

  return (
    <TableRow data-state={isSelected ? "selected" : undefined}>
      <TableCell className={cn(CELL_CLASS, "text-center")}>
        <Checkbox
          className="mx-auto"
          checked={isSelected}
          aria-label={`Selecionar o item “${item.title}”`}
          onCheckedChange={() => selection.toggle(item)}
        />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <ItemTitleCell itemId={item.id} title={item.title} />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <StatusCell item={item} />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <PriorityCell item={item} />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <AssigneeCell folderId={folderId} item={item} />
      </TableCell>
      <TableCell className={CELL_CLASS}>
        <DueDateCell item={item} />
      </TableCell>
      <TableCell className={cn(CELL_CLASS, "text-center")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Abrir o item “${item.title}”`}
              onClick={() => openItem(item.id)}
            >
              <PanelRightOpen />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Abrir detalhes</TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

// Last row of the table: type a title and press Enter to add an item, and the
// field stays focused for the next one.
function QuickAddRow({ folderId, sectionId }: { folderId: string; sectionId: string }) {
  const createMutation = useCreateItemMutation(folderId, { silent: true });
  const [title, setTitle] = React.useState("");

  function submit() {
    const next = title.trim();
    if (!next || createMutation.isPending) return;
    createMutation.mutate({ title: next, sectionId }, { onSuccess: () => setTitle("") });
  }

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={7} className="p-0.5!">
        <div className="relative">
          <Plus className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Título do novo item"
            placeholder="Novo item — digite o título e pressione Enter"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
              if (e.key === "Escape") setTitle("");
            }}
            className="h-8 border-transparent bg-transparent pl-8 shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent"
          />
          {createMutation.isPending ? (
            <Loader2 className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

const HEAD_CLASS = "h-9! border-r border-border/60 px-2.5 text-xs text-muted-foreground last:border-r-0";

/**
 * Spreadsheet-style view of one column's items: every cell edits in place and
 * saves on its own. Rows aren't draggable here — reordering stays on the cards view.
 */
export function ItemTable({
  folderId,
  sectionId,
  items,
  canManage,
  emptyMessage = "Nenhum item aqui ainda.",
  scrollable = true,
}: {
  folderId: string;
  sectionId: string;
  items: Item[];
  canManage: boolean;
  emptyMessage?: string;
  // The table has a minimum width. When the parent already guarantees that
  // width and owns the horizontal scroll (the board), pass `false` so the table
  // doesn't grow a second scrollbar of its own inside the column.
  scrollable?: boolean;
}) {
  const selection = useItemSelection();
  const selectedHere = items.filter((item) => selection.isSelected(item.id)).length;
  const allSelected = items.length > 0 && selectedHere === items.length;

  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-background",
        !scrollable && "**:data-[slot=table-container]:overflow-visible"
      )}
    >
      <Table className="min-w-4xl table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(HEAD_CLASS, "w-10 px-0.5!")}>
              <Checkbox
                className="mx-auto"
                checked={allSelected ? true : selectedHere > 0 ? "indeterminate" : false}
                disabled={items.length === 0}
                aria-label="Selecionar todos os itens desta coluna"
                onCheckedChange={() =>
                  allSelected
                    ? selection.deselect(items.map((item) => item.id))
                    : selection.select(items)
                }
              />
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-auto")}>Item</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-44")}>Status</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-40")}>Prioridade</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-48")}>Responsável</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-40")}>Prazo</TableHead>
            <TableHead className={cn(HEAD_CLASS, "w-12")}>
              <span className="sr-only">Abrir</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => <ItemRow key={item.id} folderId={folderId} item={item} />)
          )}
          {canManage ? <QuickAddRow folderId={folderId} sectionId={sectionId} /> : null}
        </TableBody>
      </Table>
    </div>
  );
}
