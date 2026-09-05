"use client";

import { SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import {
  useCustomFieldsQuery,
  useSetTaskCustomFieldValueMutation,
  useTaskCustomFieldValuesQuery,
} from "@/features/custom-fields/hooks/use-custom-fields";
import { TaskCustomFieldValueInput } from "@/features/custom-fields/components/task-custom-field-value-input";

export function TaskCustomFieldValuesEditor({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId: string;
}) {
  const definitionsQuery = useCustomFieldsQuery(projectId);
  const valuesQuery = useTaskCustomFieldValuesQuery(taskId);
  const setValueMutation = useSetTaskCustomFieldValueMutation(taskId);

  if (definitionsQuery.isLoading || valuesQuery.isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (definitionsQuery.isError) {
    return (
      <ErrorState error={definitionsQuery.error} onRetry={() => definitionsQuery.refetch()} />
    );
  }

  const activeDefinitions = (definitionsQuery.data ?? []).filter((d) => !d.archived);

  if (activeDefinitions.length === 0) {
    return (
      <EmptyState
        icon={<SlidersHorizontal className="size-5" />}
        title="Nenhum campo personalizado neste projeto"
      />
    );
  }

  return (
    <div className="space-y-4">
      {activeDefinitions.map((definition) => {
        const existing = valuesQuery.data?.find((v) => v.fieldDefinitionId === definition.id);
        return (
          <div key={definition.id} className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{definition.name}</label>
            <TaskCustomFieldValueInput
              key={`${taskId}-${definition.id}`}
              projectId={projectId}
              definition={definition}
              value={existing?.value ?? null}
              isSaving={setValueMutation.isPending}
              onSave={(value) =>
                setValueMutation.mutate({ definitionId: definition.id, payload: { value } })
              }
            />
          </div>
        );
      })}
    </div>
  );
}
