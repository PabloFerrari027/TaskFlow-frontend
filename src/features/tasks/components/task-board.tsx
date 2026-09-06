"use client";

import * as React from "react";
import { Plus } from "lucide-react";
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

  const sections = sectionsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <TaskViewToggle value={viewMode} onChange={setViewMode} />
        <RoleGate allowed={canManage}>
          <Button size="sm" variant="outline" onClick={() => setCreateSectionOpen(true)}>
            <Plus /> Nova coluna
          </Button>
        </RoleGate>
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
          {sections.map((section, index) => (
            <SectionColumn
              key={section.id}
              projectId={projectId}
              section={section}
              index={index}
              count={sections.length}
              canManage={canManage}
              viewMode={viewMode}
              onAddTask={() => setCreateTaskSectionId(section.id)}
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
