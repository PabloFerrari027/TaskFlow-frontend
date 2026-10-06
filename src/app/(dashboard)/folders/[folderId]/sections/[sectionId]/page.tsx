"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useSectionsQuery } from "@/features/sections/hooks/use-sections";
import { SectionColumn } from "@/features/items/components/section-column";
import { ItemDetailSheet } from "@/features/items/components/item-detail-sheet";
import { ItemFiltersBar } from "@/features/items/components/item-filters-bar";
import { ItemFormDialog } from "@/features/items/components/item-form-dialog";
import { ItemSelectionBar } from "@/features/items/components/item-selection-bar";
import { ItemSelectionProvider } from "@/features/items/context/item-selection-context";
import { ItemViewToggle } from "@/features/items/components/item-view-toggle";
import { useItemFilters } from "@/features/items/hooks/use-item-filters";
import { useItemViewMode } from "@/features/items/hooks/use-item-view-mode";

// A single column on its own page. This route sits outside the folder
// layout on purpose: no folder header or tabs, just the column (the app's
// own sidebar comes from the dashboard layout).
export default function SectionPage(
  props: PageProps<"/folders/[folderId]/sections/[sectionId]">
) {
  const { folderId, sectionId } = use(props.params);
  const sectionsQuery = useSectionsQuery(folderId);
  const { viewMode, setViewMode } = useItemViewMode();
  const { filters, patchFilters, resetFilters, activeCount } = useItemFilters();
  const [createItemSectionId, setCreateItemSectionId] = React.useState<string | null>(null);

  const sections = sectionsQuery.data ?? [];
  const section = sections.find((candidate) => candidate.id === sectionId);
  const backHref = `/folders/${folderId}/items`;

  let content: React.ReactNode;
  if (sectionsQuery.isLoading) {
    content = <Skeleton className="min-h-[calc(100vh-8rem)] w-full" />;
  } else if (sectionsQuery.isError) {
    content = <ErrorState error={sectionsQuery.error} onRetry={() => sectionsQuery.refetch()} />;
  } else if (!section) {
    // Also what you land on after deleting the column from this page.
    content = (
      <EmptyState
        icon={<Columns3 className="size-6" />}
        title="Esta coluna não existe mais"
        description="Ela pode ter sido apagada ou movida. Volte à pasta para ver as colunas disponíveis."
        action={
          <Button asChild>
            <Link href={backHref}>
              <ArrowLeft /> Voltar à pasta
            </Link>
          </Button>
        }
      />
    );
  } else {
    content = (
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <ItemFiltersBar
            folderId={folderId}
            filters={filters}
            onChange={patchFilters}
            onReset={resetFilters}
            activeCount={activeCount}
          />
          <ItemViewToggle value={viewMode} onChange={setViewMode} />
        </div>
        <div className="flex min-h-[calc(100vh-11rem)]">
          <SectionColumn
            folderId={folderId}
            section={section}
            allSections={sections}
            // Same as the board, which doesn't gate column/item actions by role.
            canManage
            viewMode={viewMode}
            onAddItem={setCreateItemSectionId}
            filters={filters}
            expanded
            expandHref={backHref}
          />
        </div>
      </div>
    );
  }

  return (
    <ItemSelectionProvider>
      {content}
      <ItemSelectionBar folderId={folderId} />
      {createItemSectionId ? (
        <ItemFormDialog
          folderId={folderId}
          sectionId={createItemSectionId}
          open
          onOpenChange={(open) => !open && setCreateItemSectionId(null)}
        />
      ) : null}
      <ItemDetailSheet folderId={folderId} />
    </ItemSelectionProvider>
  );
}
