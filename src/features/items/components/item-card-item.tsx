"use client";

import { Clock, Diamond, Paperclip } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { ItemDueDateBadge, ItemPriorityBadge } from "@/components/shared/status-badge";
import { ItemCardCover } from "@/features/items/components/item-cover";
import { useItemSelection } from "@/features/items/context/item-selection-context";
import { ItemStatusSelect } from "@/features/items/components/item-status-select";
import { useItemPanel } from "@/features/items/hooks/use-item-panel";
import { useItemDropTarget } from "@/features/items/hooks/use-item-drop-target";
import { setLiftedDragImage, ITEM_DRAG_MIME } from "@/lib/dnd";
import { stripMarkdown } from "@/lib/markdown-format";
import { formatDate, formatMinutes, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Item } from "@/types/item";

interface ItemCardItemProps {
  item: Item;
  onReorder: (payload: { itemId: string; fromSectionId: string; targetPosition: number }) => void;
}

export function ItemCardItem({ item, onReorder }: ItemCardItemProps) {
  const { openItem } = useItemPanel();
  const selection = useItemSelection();
  const isSelected = selection.isSelected(item.id);
  const { dropEdge, handleDragOver, handleDragLeave, handleDrop } = useItemDropTarget(
    item,
    onReorder
  );

  return (
    <div
      role="button"
      tabIndex={0}
      data-tour="item-card"
      data-tour-href={`/folders/${item.folderId}/items/${item.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          ITEM_DRAG_MIME,
          JSON.stringify({ itemId: item.id, sectionId: item.sectionId })
        );
        e.dataTransfer.effectAllowed = "move";
        setLiftedDragImage(e);
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        // With something already selected a click keeps picking (Ctrl/Shift
        // always does); otherwise it opens the item like before.
        if (selection.count > 0 || e.ctrlKey || e.metaKey || e.shiftKey) selection.toggle(item);
        else openItem(item.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openItem(item.id);
        }
      }}
      className={cn(
        "group/card relative flex w-full cursor-grab flex-col gap-2.5 rounded-lg border border-border/60 bg-background p-3.5 text-left transition-colors hover:bg-muted/50 active:cursor-grabbing",
        isSelected && "border-primary bg-primary/5 hover:bg-primary/10",
        dropEdge === "above" && "shadow-[inset_0_2px_0_0_var(--primary)]",
        dropEdge === "below" && "shadow-[inset_0_-2px_0_0_var(--primary)]"
      )}
    >
      <Checkbox
        checked={isSelected}
        aria-label={`Selecionar o item “${item.title}”`}
        onCheckedChange={() => selection.toggle(item)}
        // The card opens the item on click and on Enter/Space — neither should
        // fire when the checkbox itself is used.
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className={cn(
          // Straddles the card's corner: the 14px padding keeps it off the text.
          "absolute -top-1.5 -left-1.5 z-10 bg-background shadow-xs dark:bg-background",
          // Hidden until hover/focus, but always there once anything is picked
          // and on touch screens where there is no hover.
          !isSelected &&
            selection.count === 0 &&
            "opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        )}
      />

      <ItemCardCover item={item} />

      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{item.title}</span>
        {item.attachments.length > 0 ? (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Paperclip className="size-3.5" />
            {item.attachments.length}
          </span>
        ) : null}
      </div>

      {item.description ? (
        <p className="line-clamp-3 text-xs text-muted-foreground">{stripMarkdown(item.description)}</p>
      ) : null}

      {item.priority || item.dueDate || item.isMilestone || item.estimateMinutes ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {item.isMilestone ? (
            <span className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400">
              <Diamond className="size-3" /> Marco
            </span>
          ) : null}
          {item.priority ? <ItemPriorityBadge priority={item.priority} /> : null}
          {item.startDate && item.dueDate ? (
            <span className="text-xs text-muted-foreground">
              {formatDate(item.startDate, "d MMM")} →
            </span>
          ) : null}
          {item.dueDate ? <ItemDueDateBadge dueDate={item.dueDate} /> : null}
          {item.estimateMinutes ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" /> {formatMinutes(item.estimateMinutes)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        {(item.assigneeIds?.length ?? 0) > 1 ? (
          <div className="flex items-center -space-x-1.5">
            {item.assigneeIds.slice(0, 4).map((userId) => (
              <MemberAvatar key={userId} userId={userId} className="ring-2 ring-card" />
            ))}
            {item.assigneeIds.length > 4 ? (
              <span className="pl-2.5 text-xs text-muted-foreground">
                +{item.assigneeIds.length - 4}
              </span>
            ) : null}
          </div>
        ) : item.assigneeId ? (
          <div className="flex items-center gap-1.5">
            <MemberAvatar userId={item.assigneeId} />
            <MemberIdLabel userId={item.assigneeId} />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Sem responsável</span>
        )}
        <ItemStatusSelect item={item} size="sm" />
      </div>

      <p className="text-[0.7rem] text-muted-foreground">
        Atualizado {formatRelativeTime(item.updatedAt)}
      </p>
    </div>
  );
}
