"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/shared/error-state";
import { FoldedSection } from "@/components/shared/folded-section";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { useItemQuery } from "@/features/items/hooks/use-items";
import { ItemStatusSelect } from "@/features/items/components/item-status-select";
import { ItemSectionSelect } from "@/features/items/components/item-section-select";
import { ItemPrioritySelect } from "@/features/items/components/item-priority-select";
import { ItemDueDateInput } from "@/features/items/components/item-due-date-input";
import { ItemAssigneesField } from "@/features/items/components/item-assignees-field";
import {
  ItemEstimateFields,
  ItemScheduleFields,
} from "@/features/items/components/item-planning-fields";
import {
  ItemDescriptionField,
  ItemTitleField,
} from "@/features/items/components/item-inline-text-fields";
import { SubitemList } from "@/features/items/components/subitem-list";
import { ItemDependenciesSection } from "@/features/items/components/item-dependencies-section";
import { ItemTimeSection } from "@/features/time-tracking/components/item-time-section";
import { ItemApprovalsSection } from "@/features/approvals/components/item-approvals-section";
import { AttachmentsSection } from "@/features/items/components/attachments-section";
import { ItemCoverBanner } from "@/features/items/components/item-cover";
import { ParticipantsSection } from "@/features/items/components/participants-section";
import { CommentComposer } from "@/features/comments/components/comment-composer";
import { CommentList } from "@/features/comments/components/comment-list";
import { ItemActivitySection } from "@/features/activity/components/item-activity-section";
import { ItemCustomFieldValuesEditor } from "@/features/custom-fields/components/item-custom-field-values-editor";
import { cn } from "@/lib/utils";

/** One "label → value" line of the properties list (Notion/Linear style). */
function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3 py-1.5 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="min-w-0 max-w-sm">{children}</div>
    </div>
  );
}

// Shared by the full-screen item page and the side panel. One reading column
// in both: title, the few properties everyone uses, then the rest folded away.
export function ItemDetailView({
  folderId,
  itemId,
  layout = "grid",
}: {
  folderId: string;
  itemId: string;
  layout?: "grid" | "stacked";
}) {
  const itemQuery = useItemQuery(itemId);

  if (itemQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (itemQuery.isError || !itemQuery.data) {
    return <ErrorState error={itemQuery.error} onRetry={() => itemQuery.refetch()} />;
  }

  const item = itemQuery.data;

  return (
    <div className={cn("space-y-6", layout === "grid" && "mx-auto max-w-3xl")}>
      <ItemCoverBanner item={item} />

      <div data-tour="item-main">
        {/* Both fields save on blur — no separate edit mode. */}
        <ItemTitleField itemId={item.id} title={item.title} />
        <ItemDescriptionField folderId={folderId} itemId={item.id} description={item.description} />
      </div>

      <div className="divide-y border-y" data-tour="item-fields">
        <PropertyRow label="Etapa">
          <ItemStatusSelect item={item} />
        </PropertyRow>
        <PropertyRow label="Prazo">
          <ItemDueDateInput itemId={item.id} dueDate={item.dueDate} dueDateHasTime={item.dueDateHasTime} />
        </PropertyRow>
        <PropertyRow label="Responsável">
          <ItemAssigneesField
            folderId={folderId}
            itemId={item.id}
            assigneeIds={item.assigneeIds ?? (item.assigneeId ? [item.assigneeId] : [])}
          />
        </PropertyRow>
        <PropertyRow label="Prioridade">
          <ItemPrioritySelect itemId={item.id} priority={item.priority} />
        </PropertyRow>
      </div>

      <FoldedSection
        title="Mais detalhes"
        hint="Coluna, quem acompanha, início, tempo estimado, campos extras e mais"
      >
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Coluna</p>
          <ItemSectionSelect folderId={folderId} itemId={item.id} sectionId={item.sectionId} />
          <p className="text-xs text-muted-foreground">
            Onde o item aparece no quadro da pasta. Mudar de coluna não muda a etapa.
          </p>
        </div>
        <Separator />
        <ParticipantsSection folderId={folderId} itemId={item.id} participantIds={item.participantIds} />
        <Separator />
        <ItemScheduleFields item={item} />
        <Separator />
        <ItemEstimateFields key={`${item.estimateMinutes}:${item.storyPoints}`} item={item} />
        <Separator />
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Campos extras</p>
          <ItemCustomFieldValuesEditor folderId={folderId} itemId={item.id} />
        </div>
        <Separator />
        <ItemDependenciesSection folderId={folderId} itemId={item.id} />
        <Separator />
        <ItemApprovalsSection folderId={folderId} itemId={item.id} />
        <Separator />
        <ItemTimeSection itemId={item.id} estimateMinutes={item.estimateMinutes} />
        <Separator />
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Criado por</p>
          {item.createdBy ? (
            <div className="flex items-center gap-2">
              <MemberAvatar userId={item.createdBy} />
              <MemberIdLabel userId={item.createdBy} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Criador desconhecido</p>
          )}
        </div>
      </FoldedSection>

      <SubitemList folderId={folderId} parentItemId={item.id} sectionId={item.sectionId} />

      <AttachmentsSection itemId={item.id} attachments={item.attachments} />

      <div className="space-y-3" data-tour="item-comments">
        <h3 className="text-sm font-medium text-foreground">Comentários</h3>
        <CommentList itemId={item.id} folderId={folderId} />
        <CommentComposer itemId={item.id} folderId={folderId} />
      </div>

      <FoldedSection title="Histórico" hint="Cada mudança feita neste item">
        <ItemActivitySection itemId={item.id} folderId={item.folderId} showTitle={false} />
      </FoldedSection>
    </div>
  );
}
