"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildTree, collectDescendantIds, type TreeNode } from "@/lib/tree";
import { cn } from "@/lib/utils";

export interface ParentPickerItem {
  id: string;
  parentId: string | null;
  name: string;
  // Extra reason (beyond "is/under the moved item") that makes this
  // destination invalid, e.g. an archived project.
  disabledReason?: string;
}

interface ParentPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  rootLabel: string;
  items: ParentPickerItem[];
  movingId: string;
  currentParentId: string | null;
  isPending: boolean;
  onConfirm: (parentId: string | null) => void;
}

interface Row {
  item: ParentPickerItem;
  depth: number;
  disabledReason: string | null;
}

// The moved item and everything beneath it are invalid destinations (they'd
// close a cycle). Computing that from the already-loaded tree lets us disable
// them up front instead of letting the user pick one and fail on the server
// with CANNOT_MOVE_INTO_OWN_DESCENDANT.
function flatten(
  nodes: TreeNode<ParentPickerItem>[],
  movingId: string,
  blocked: Set<string>,
  depth = 0
): Row[] {
  return nodes.flatMap((node) => {
    const reason =
      node.item.id === movingId
        ? "É o próprio item"
        : blocked.has(node.item.id)
          ? "Está dentro do item"
          : (node.item.disabledReason ?? null);
    return [
      { item: node.item, depth, disabledReason: reason },
      ...flatten(node.children, movingId, blocked, depth + 1),
    ];
  });
}

function ParentPickerBody({
  title,
  description,
  rootLabel,
  items,
  movingId,
  currentParentId,
  isPending,
  onConfirm,
}: Omit<ParentPickerDialogProps, "open" | "onOpenChange">) {
  // Lives inside DialogContent, which unmounts on close — so the selection
  // resets to the current parent every time the dialog reopens.
  const [selected, setSelected] = React.useState<string | null>(currentParentId);

  const rows = React.useMemo(
    () => flatten(buildTree(items), movingId, collectDescendantIds(items, movingId)),
    [items, movingId]
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>

      <div
        role="radiogroup"
        aria-label={title}
        className="max-h-72 space-y-0.5 overflow-y-auto rounded-lg border border-border/60 p-1"
      >
        <PickerOption
          label={rootLabel}
          depth={0}
          checked={selected === null}
          onSelect={() => setSelected(null)}
        />
        {rows.map(({ item, depth, disabledReason }) => (
          <PickerOption
            key={item.id}
            label={item.name}
            depth={depth + 1}
            checked={selected === item.id}
            disabledReason={disabledReason}
            onSelect={() => setSelected(item.id)}
          />
        ))}
      </div>

      <DialogFooter>
        <Button
          disabled={isPending || selected === currentParentId}
          onClick={() => onConfirm(selected)}
        >
          {isPending ? <Loader2 className="animate-spin" /> : null}
          Mover
        </Button>
      </DialogFooter>
    </>
  );
}

function PickerOption({
  label,
  depth,
  checked,
  disabledReason,
  onSelect,
}: {
  label: string;
  depth: number;
  checked: boolean;
  disabledReason?: string | null;
  onSelect: () => void;
}) {
  const disabled = Boolean(disabledReason);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={onSelect}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      className={cn(
        "flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition-colors",
        checked ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted/60",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {disabledReason ? (
        <span className="shrink-0 text-xs text-muted-foreground">{disabledReason}</span>
      ) : null}
      {checked ? <Check className="size-4 shrink-0 text-primary" /> : null}
    </button>
  );
}

export function ParentPickerDialog({
  open,
  onOpenChange,
  ...bodyProps
}: ParentPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <ParentPickerBody {...bodyProps} />
      </DialogContent>
    </Dialog>
  );
}
