"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/shared/error-state";
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

// Shared by the full-screen item page and the side panel — `layout` picks
// between the two-column page grid and a single stacked column for the sheet.
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

  const subitemsAndAttachments = (
    <>
      <Card className="p-5">
        <SubitemList folderId={folderId} parentItemId={item.id} sectionId={item.sectionId} />
      </Card>

      <Card className="p-5">
        <ItemDependenciesSection folderId={folderId} itemId={item.id} />
      </Card>

      <Card className="p-5">
        <ItemApprovalsSection folderId={folderId} itemId={item.id} />
      </Card>

      <Card className="p-5">
        <ItemTimeSection itemId={item.id} estimateMinutes={item.estimateMinutes} />
      </Card>

      <Card className="p-5">
        <AttachmentsSection itemId={item.id} attachments={item.attachments} />
      </Card>
    </>
  );

  return (
    <div className="space-y-6">
      <ItemCoverBanner item={item} />

      <div className={cn("gap-6", layout === "grid" ? "grid lg:grid-cols-3" : "flex flex-col")}>
        <div className={cn("space-y-6", layout === "grid" ? "lg:col-span-2" : "")}>
          <Card className="p-5" data-tour="item-main">
            {/* Both fields save on blur — no separate edit mode. */}
            <ItemTitleField itemId={item.id} title={item.title} />
            <ItemDescriptionField
              folderId={folderId}
              itemId={item.id}
              description={item.description}
            />
          </Card>

          {layout === "grid" ? subitemsAndAttachments : null}
        </div>

        <div className="space-y-6">
          <Card className="space-y-4 p-5" data-tour="item-fields">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Coluna</p>
              <ItemSectionSelect folderId={folderId} itemId={item.id} sectionId={item.sectionId} />
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Etapa</p>
              <ItemStatusSelect item={item} />
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Responsáveis</p>
              <ItemAssigneesField
                folderId={folderId}
                itemId={item.id}
                assigneeIds={item.assigneeIds ?? (item.assigneeId ? [item.assigneeId] : [])}
              />
            </div>

            <Separator />

            <ParticipantsSection
              folderId={folderId}
              itemId={item.id}
              participantIds={item.participantIds}
            />

            <Separator />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Prazo</p>
              <ItemDueDateInput itemId={item.id} dueDate={item.dueDate} />
              {item.dueDate ? (
                <p className="text-xs text-muted-foreground">
                  Depois de definido, o prazo só pode ser trocado por outra data.
                </p>
              ) : null}
            </div>

            <Separator />

            <ItemScheduleFields item={item} />

            <Separator />

            <ItemEstimateFields key={`${item.estimateMinutes}:${item.storyPoints}`} item={item} />

            <Separator />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Prioridade</p>
              <ItemPrioritySelect itemId={item.id} priority={item.priority} />
              {item.priority ? (
                <p className="text-xs text-muted-foreground">
                  Depois de definida, a prioridade só pode ser trocada por outra.
                </p>
              ) : null}
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase">Criado por</p>
              {item.createdBy ? (
                <div className="flex items-center gap-2">
                  <MemberAvatar userId={item.createdBy} />
                  <MemberIdLabel userId={item.createdBy} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Criador desconhecido</p>
              )}
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Campos personalizados
            </p>
            <ItemCustomFieldValuesEditor folderId={folderId} itemId={item.id} />
          </Card>
        </div>

        {/* Stacked layout has no side column, so these follow all the item
            info above instead of sitting between the description and it. */}
        {layout === "stacked" ? <div className="space-y-6">{subitemsAndAttachments}</div> : null}
      </div>

      {/* Always the last sections on the page, regardless of `layout` — a
          comment thread and the change history read as the closing part of
          an item, after every other detail is already visible. */}
      <Card className="space-y-3 p-5" data-tour="item-comments">
        <h3 className="text-sm font-medium text-foreground">Comentários</h3>
        <CommentList itemId={item.id} folderId={folderId} />
        <CommentComposer itemId={item.id} folderId={folderId} />
      </Card>

      <Card className="p-5">
        <ItemActivitySection itemId={item.id} folderId={item.folderId} />
      </Card>
    </div>
  );
}
