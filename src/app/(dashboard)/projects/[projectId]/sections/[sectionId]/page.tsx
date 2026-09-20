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
import { SectionColumn } from "@/features/tasks/components/section-column";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { TaskFiltersBar } from "@/features/tasks/components/task-filters-bar";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { TaskViewToggle } from "@/features/tasks/components/task-view-toggle";
import { useTaskFilters } from "@/features/tasks/hooks/use-task-filters";
import { useTaskViewMode } from "@/features/tasks/hooks/use-task-view-mode";

// A single column on its own page. This route sits outside the project
// layout on purpose: no project header or tabs, just the column (the app's
// own sidebar comes from the dashboard layout).
export default function SectionPage(
  props: PageProps<"/projects/[projectId]/sections/[sectionId]">
) {
  const { projectId, sectionId } = use(props.params);
  const sectionsQuery = useSectionsQuery(projectId);
  const { viewMode, setViewMode } = useTaskViewMode();
  const { filters, patchFilters, resetFilters, activeCount } = useTaskFilters();
  const [createTaskSectionId, setCreateTaskSectionId] = React.useState<string | null>(null);

  const sections = sectionsQuery.data ?? [];
  const section = sections.find((candidate) => candidate.id === sectionId);
  const backHref = `/projects/${projectId}/tasks`;

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
        description="Ela pode ter sido apagada ou movida. Volte ao projeto para ver as colunas disponíveis."
        action={
          <Button asChild>
            <Link href={backHref}>
              <ArrowLeft /> Voltar ao projeto
            </Link>
          </Button>
        }
      />
    );
  } else {
    content = (
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <TaskFiltersBar
            projectId={projectId}
            filters={filters}
            onChange={patchFilters}
            onReset={resetFilters}
            activeCount={activeCount}
          />
          <TaskViewToggle value={viewMode} onChange={setViewMode} />
        </div>
        <div className="flex min-h-[calc(100vh-11rem)]">
          <SectionColumn
            projectId={projectId}
            section={section}
            allSections={sections}
            // Same as the board, which doesn't gate column/task actions by role.
            canManage
            viewMode={viewMode}
            onAddTask={setCreateTaskSectionId}
            filters={filters}
            expanded
            expandHref={backHref}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {content}
      {createTaskSectionId ? (
        <TaskFormDialog
          projectId={projectId}
          sectionId={createTaskSectionId}
          open
          onOpenChange={(open) => !open && setCreateTaskSectionId(null)}
        />
      ) : null}
      <TaskDetailSheet projectId={projectId} />
    </>
  );
}
