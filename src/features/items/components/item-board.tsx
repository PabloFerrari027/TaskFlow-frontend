"use client";

import * as React from "react";
import { Columns3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { RoleGate } from "@/components/shared/role-gate";
import { useSectionsQuery } from "@/features/sections/hooks/use-sections";
import { SectionFormDialog } from "@/features/sections/components/section-form-dialog";
import { SectionColumn } from "@/features/items/components/section-column";
import { ItemFiltersBar } from "@/features/items/components/item-filters-bar";
import { ItemFormDialog } from "@/features/items/components/item-form-dialog";
import { ItemSelectionBar } from "@/features/items/components/item-selection-bar";
import { ItemSelectionProvider } from "@/features/items/context/item-selection-context";
import { ItemViewToggle } from "@/features/items/components/item-view-toggle";
import { SavedViewsMenu } from "@/features/items/components/saved-views-menu";
import { useItemFilters } from "@/features/items/hooks/use-item-filters";
import { useItemViewMode } from "@/features/items/hooks/use-item-view-mode";

export function ItemBoard(props: { folderId: string; canManage: boolean }) {
  return (
    <ItemSelectionProvider>
      <ItemBoardContent {...props} />
    </ItemSelectionProvider>
  );
}

function ItemBoardContent({
  folderId,
  canManage,
}: {
  folderId: string;
  canManage: boolean;
}) {
  const sectionsQuery = useSectionsQuery(folderId);
  const [createSectionOpen, setCreateSectionOpen] = React.useState(false);
  const [createItemSectionId, setCreateItemSectionId] = React.useState<string | null>(null);
  const { viewMode, setViewMode } = useItemViewMode();
  const { filters, patchFilters, resetFilters, activeCount } = useItemFilters();

  const sections = React.useMemo(() => sectionsQuery.data ?? [], [sectionsQuery.data]);
  // Only root sections are board columns; sub-sections live inside their
  // parent's column as an accordion. A section whose parent isn't in the list
  // is treated as a root so it never vanishes from the board.
  const rootSections = React.useMemo(() => {
    const ids = new Set(sections.map((section) => section.id));
    return sections.filter((section) => !section.parentId || !ids.has(section.parentId));
  }, [sections]);
  // "Novo item" in the toolbar drops into the folder's default column, or
  // the first one when none is flagged as default.
  const firstSectionId = (rootSections.find((s) => s.isDefault) ?? rootSections[0])?.id;

  return (
    <div className="space-y-4">
      <div
        data-tour="board-toolbar"
        className="flex flex-wrap items-center justify-between gap-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick-add: the per-column button can sit far below a long list. */}
          <Button
            size="sm"
            disabled={!firstSectionId}
            onClick={() => firstSectionId && setCreateItemSectionId(firstSectionId)}
          >
            <Plus /> Novo item
          </Button>
          <RoleGate allowed={canManage}>
            <Button size="sm" variant="outline" onClick={() => setCreateSectionOpen(true)}>
              <Columns3 /> Adicionar coluna
            </Button>
          </RoleGate>
          <SavedViewsMenu
            folderId={folderId}
            filters={filters}
            viewMode={viewMode}
            onApply={(next, mode) => {
              patchFilters(next);
              setViewMode(mode);
            }}
          />
        </div>
        <ItemViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      <div data-tour="board-filters">
        <ItemFiltersBar
          folderId={folderId}
          filters={filters}
          onChange={patchFilters}
          onReset={resetFilters}
          activeCount={activeCount}
        />
      </div>

      {sectionsQuery.isLoading ? (
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-72 shrink-0" />
          ))}
        </div>
      ) : sectionsQuery.isError ? (
        <ErrorState error={sectionsQuery.error} onRetry={() => sectionsQuery.refetch()} />
      ) : (
        <div
          data-tour="board-columns"
          className="flex items-start gap-4 overflow-x-auto pb-2"
        >
          {rootSections.map((section, index) => (
            <SectionColumn
              key={section.id}
              folderId={folderId}
              section={section}
              allSections={sections}
              index={index}
              count={rootSections.length}
              canManage={canManage}
              viewMode={viewMode}
              onAddItem={setCreateItemSectionId}
              filters={filters}
              expandHref={`/folders/${folderId}/sections/${section.id}`}
            />
          ))}
        </div>
      )}

      <SectionFormDialog
        folderId={folderId}
        open={createSectionOpen}
        onOpenChange={setCreateSectionOpen}
      />
      {createItemSectionId ? (
        <ItemFormDialog
          folderId={folderId}
          sectionId={createItemSectionId}
          open={Boolean(createItemSectionId)}
          onOpenChange={(open) => !open && setCreateItemSectionId(null)}
        />
      ) : null}

      <ItemSelectionBar folderId={folderId} />
    </div>
  );
}
