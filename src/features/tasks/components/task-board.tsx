"use client";

import * as React from "react";
import { Columns3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { RoleGate } from "@/components/shared/role-gate";
import { useSectionsQuery } from "@/features/sections/hooks/use-sections";
import { SectionFormDialog } from "@/features/sections/components/section-form-dialog";
import { SectionColumn } from "@/features/tasks/components/section-column";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { TaskViewToggle } from "@/features/tasks/components/task-view-toggle";
import { useTaskViewMode } from "@/features/tasks/hooks/use-task-view-mode";

export function TaskBoard({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
}) {
  const sectionsQuery = useSectionsQuery(projectId);
  const [createSectionOpen, setCreateSectionOpen] = React.useState(false);
  const [createTaskSectionId, setCreateTaskSectionId] = React.useState<string | null>(null);
  const { viewMode, setViewMode } = useTaskViewMode();

  const sections = React.useMemo(() => sectionsQuery.data ?? [], [sectionsQuery.data]);
  // Only root sections are board columns; sub-sections live inside their
  // parent's column as an accordion. A section whose parent isn't in the list
  // is treated as a root so it never vanishes from the board.
  const rootSections = React.useMemo(() => {
    const ids = new Set(sections.map((section) => section.id));
    return sections.filter((section) => !section.parentId || !ids.has(section.parentId));
  }, [sections]);
  // "Nova tarefa" in the toolbar drops into the project's default column, or
  // the first one when none is flagged as default.
  const firstSectionId = (rootSections.find((s) => s.isDefault) ?? rootSections[0])?.id;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick-add: the per-column button can sit far below a long list. */}
          <Button
            size="sm"
            disabled={!firstSectionId}
            onClick={() => firstSectionId && setCreateTaskSectionId(firstSectionId)}
          >
            <Plus /> Nova tarefa
          </Button>
          <RoleGate allowed={canManage}>
            <Button size="sm" variant="outline" onClick={() => setCreateSectionOpen(true)}>
              <Columns3 /> Adicionar coluna
            </Button>
          </RoleGate>
        </div>
        <TaskViewToggle value={viewMode} onChange={setViewMode} />
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
        <div className="flex items-start gap-4 overflow-x-auto pb-2">
          {rootSections.map((section, index) => (
            <SectionColumn
              key={section.id}
              projectId={projectId}
              section={section}
              allSections={sections}
              index={index}
              count={rootSections.length}
              canManage={canManage}
              viewMode={viewMode}
              onAddTask={setCreateTaskSectionId}
              expandHref={`/projects/${projectId}/sections/${section.id}`}
            />
          ))}
        </div>
      )}

      <SectionFormDialog
        projectId={projectId}
        open={createSectionOpen}
        onOpenChange={setCreateSectionOpen}
      />
      {createTaskSectionId ? (
        <TaskFormDialog
          projectId={projectId}
          sectionId={createTaskSectionId}
          open={Boolean(createTaskSectionId)}
          onOpenChange={(open) => !open && setCreateTaskSectionId(null)}
        />
      ) : null}
    </div>
  );
}
