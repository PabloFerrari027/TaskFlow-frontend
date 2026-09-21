"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksService } from "@/features/tasks/api/tasks-service";
import {
  scheduleTaskListsRefresh,
  shouldRestoreSnapshot,
  TASK_MUTATION_KEY,
} from "@/features/tasks/lib/task-list-refresh";
import { queryKeys } from "@/lib/query-keys";
import { getBulkItemErrorMessage, getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE, type PaginatedResult } from "@/types/common";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import {
  isOffline,
  pushImmediate,
  queueEntityDelete,
  queueEntityUpdate,
} from "@/features/sync/lib/sync-engine";
import type {
  BulkResult,
  ChangeTaskStatusRequest,
  CreateTaskRequest,
  Task,
  UpdateTaskRequest,
} from "@/types/task";

function withCountAdjusted(result: PaginatedResult<Task>, delta: number): PaginatedResult<Task> {
  const total = Math.max(0, result.meta.total + delta);
  return {
    ...result,
    meta: {
      ...result.meta,
      total,
      totalPages: Math.max(1, Math.ceil(total / result.meta.limit)),
    },
  };
}

type PreviousSectionEntries = Array<{ queryKey: QueryKey; data: PaginatedResult<Task> }>;

function restoreSectionEntries(queryClient: QueryClient, entries?: PreviousSectionEntries) {
  if (!shouldRestoreSnapshot(queryClient)) return;
  entries?.forEach(({ queryKey, data }) => queryClient.setQueryData(queryKey, data));
}

// Each board column is its own paginated cache (tasks.bySection), so a
// cross-column move has to touch the source and the destination directly.
// Returns the entries it overwrote so the caller can roll back.
function moveTaskBetweenSectionCaches(
  queryClient: QueryClient,
  taskId: string,
  toSectionId: string
): PreviousSectionEntries {
  const previousEntries: PreviousSectionEntries = [];
  let movedTask: Task | undefined;

  for (const [key, data] of queryClient.getQueriesData<PaginatedResult<Task>>({
    queryKey: queryKeys.tasks.bySectionAll(),
  })) {
    if (!data) continue;
    const found = data.data.find((t) => t.id === taskId);
    if (!found) continue;
    movedTask = found;
    previousEntries.push({ queryKey: key, data });
    queryClient.setQueryData<PaginatedResult<Task>>(
      key,
      withCountAdjusted({ ...data, data: data.data.filter((t) => t.id !== taskId) }, -1)
    );
  }

  if (movedTask) {
    for (const [key, data] of queryClient.getQueriesData<PaginatedResult<Task>>({
      queryKey: queryKeys.tasks.bySection(toSectionId),
    })) {
      if (!data) continue;
      previousEntries.push({ queryKey: key, data });
      queryClient.setQueryData<PaginatedResult<Task>>(
        key,
        withCountAdjusted(
          { ...data, data: [...data.data, { ...movedTask, sectionId: toSectionId }] },
          1
        )
      );
    }
  }

  return previousEntries;
}

function removeTasksFromSectionCaches(
  queryClient: QueryClient,
  taskIds: Set<string>
): PreviousSectionEntries {
  const previousEntries: PreviousSectionEntries = [];

  for (const [key, data] of queryClient.getQueriesData<PaginatedResult<Task>>({
    queryKey: queryKeys.tasks.bySectionAll(),
  })) {
    if (!data) continue;
    const remaining = data.data.filter((t) => !taskIds.has(t.id));
    if (remaining.length === data.data.length) continue;
    previousEntries.push({ queryKey: key, data });
    queryClient.setQueryData<PaginatedResult<Task>>(
      key,
      withCountAdjusted({ ...data, data: remaining }, remaining.length - data.data.length)
    );
  }

  return previousEntries;
}

/** Options shared by the mutations that the spreadsheet-style table drives. */
interface TaskMutationOptions {
  /**
   * Inline edits in the table save cell by cell, so a success toast and a full
   * refetch per cell would be noise: `silent` skips the toast and patches the
   * task in place in every cached list instead. Errors still toast.
   */
  silent?: boolean;
}

const LIST_CACHE_PREFIXES = [queryKeys.tasks.bySectionAll(), queryKeys.tasks.byProjectAll()];

function patchTaskInLists(queryClient: QueryClient, task: Task) {
  for (const queryKey of LIST_CACHE_PREFIXES) {
    queryClient.setQueriesData<PaginatedResult<Task>>({ queryKey }, (data) =>
      data && Array.isArray(data.data)
        ? { ...data, data: data.data.map((t) => (t.id === task.id ? task : t)) }
        : data
    );
  }
  // The lists above are already correct; this only makes caches nobody is
  // looking at right now refetch the next time they're mounted.
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId), refetchType: "none" });
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll(), refetchType: "none" });
}

// The detail cache is only filled once a task is opened, but the mutations need
// the current copy (version, assignee) for offline queueing and to clear an
// assignee — so fall back to the copy sitting in a cached list.
function findCachedTask(queryClient: QueryClient, taskId: string): Task | undefined {
  const detail = queryClient.getQueryData<Task>(queryKeys.tasks.detail(taskId));
  if (detail) return detail;
  for (const queryKey of LIST_CACHE_PREFIXES) {
    for (const [, data] of queryClient.getQueriesData<PaginatedResult<Task>>({ queryKey })) {
      const found = Array.isArray(data?.data) ? data.data.find((t) => t.id === taskId) : undefined;
      if (found) return found;
    }
  }
  return undefined;
}

// Task lists can realistically grow large, so this is genuinely paged.
export function useTasksQuery(projectId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.tasks.all(projectId, page),
    queryFn: () => tasksService.listByProject(projectId, { page }),
    placeholderData: (previous) => previous,
  });
}

export function useTaskQuery(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: () => tasksService.get(taskId),
  });
}

// Subtasks per task are realistically few — fetch the max page size once.
export function useSubtasksQuery(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.subtasks(taskId),
    queryFn: () => tasksService.listSubtasks(taskId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
  });
}

// One column of the task board. Each column pages independently.
export function useTasksBySectionQuery(sectionId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.tasks.bySection(sectionId, page),
    queryFn: () => tasksService.listBySection(sectionId, { page }),
    placeholderData: (previous) => previous,
  });
}

export function useCreateTaskMutation(
  projectId: string,
  { silent = false }: TaskMutationOptions = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: TASK_MUTATION_KEY,
    mutationFn: (payload: CreateTaskRequest) => tasksService.create(projectId, payload),
    onSuccess: (task) => {
      scheduleTaskListsRefresh(queryClient, { subtaskParentIds: [task.parentTaskId] });
      if (!silent) toast.success("Tarefa criada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateTaskMutation(
  taskId: string,
  { silent = false }: TaskMutationOptions = {}
) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationKey: TASK_MUTATION_KEY,
    mutationFn: (payload: UpdateTaskRequest) => {
      const current = findCachedTask(queryClient, taskId);
      if (isOffline() && workspaceId && current) {
        // `/sync/push` payloads don't carry mentions (REST-only, API.md § 9) —
        // queueing them would drop them silently while the optimistic copy
        // showed them as saved, so they're left out and the user is told.
        const { mentionedUserIds, ...syncable } = payload;
        const currentMentions = current.mentionedUserIds ?? [];
        if (
          mentionedUserIds &&
          (mentionedUserIds.length !== currentMentions.length ||
            mentionedUserIds.some((id) => !currentMentions.includes(id)))
        ) {
          toast.warning("Menções só podem ser alteradas online — o restante da edição foi salvo.");
        }
        return Promise.resolve(
          queueEntityUpdate({
            workspaceId,
            entityType: "TASK",
            entityId: taskId,
            payload: syncable as Record<string, unknown>,
            current,
            meta: { projectId: current.projectId },
          })
        );
      }
      return tasksService.update(taskId, payload);
    },
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(taskId), task);
      if (silent) {
        patchTaskInLists(queryClient, task);
        return;
      }
      // `sectionId` may have changed, moving the task between columns — the
      // refresh covers every column since we don't track the previous one here.
      scheduleTaskListsRefresh(queryClient);
      toast.success(
        isOffline()
          ? "Alteração salva offline — será sincronizada quando a conexão voltar."
          : "Tarefa atualizada."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * `PATCH /tasks/:taskId` can never send `assigneeId: null` — omitting the
 * field just leaves the current assignee untouched, and there is no REST
 * way to clear it (API.md § 9). Clearing an assignee is only possible
 * through `/sync/push`, so this always goes through the sync engine —
 * queued when offline, pushed immediately (still bypassing REST) when
 * online — instead of `tasksService.update`.
 */
export function useUnassignTaskMutation(
  taskId: string,
  { silent = false }: TaskMutationOptions = {}
) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationKey: TASK_MUTATION_KEY,
    mutationFn: async () => {
      const current = findCachedTask(queryClient, taskId);
      if (!workspaceId || !current) {
        throw new Error("Não foi possível remover o responsável: dados da tarefa indisponíveis.");
      }

      if (isOffline()) {
        const task = queueEntityUpdate({
          workspaceId,
          entityType: "TASK",
          entityId: taskId,
          payload: { assigneeId: null },
          current,
          meta: { projectId: current.projectId },
        });
        queryClient.setQueryData(queryKeys.tasks.detail(taskId), task);
        return { projectId: task.projectId, queuedOffline: true, applied: true };
      }

      // `pushImmediate` already reconciles the cache (including the fresh
      // `version`) and toasts on REJECTED/CONFLICT — this only decides
      // whether the success toast below should fire.
      const result = await pushImmediate(queryClient, workspaceId, {
        entityType: "TASK",
        entityId: taskId,
        operationType: "UPDATE",
        payload: { assigneeId: null },
        baseVersion: current.version,
      });
      return {
        projectId: current.projectId,
        queuedOffline: false,
        applied: result?.status === "APPLIED",
      };
    },
    onSuccess: ({ queuedOffline, applied }) => {
      if (!applied) return;
      scheduleTaskListsRefresh(queryClient);
      if (silent) return;
      toast.success(
        queuedOffline
          ? "Alteração salva offline — será sincronizada quando a conexão voltar."
          : "Responsável removido."
      );
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : getErrorMessage(error)),
  });
}

// Used for the section select on the task detail view and for drag-and-drop
// on the board — the target section/position is only known at call time, so
// unlike `useUpdateTaskMutation` this isn't bound to one task via the hook args.
// `position` lets callers drop a task above/below a specific sibling instead
// of always appending to the end of the destination section's list.
export function useMoveTaskToSectionMutation() {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationKey: TASK_MUTATION_KEY,
    mutationFn: ({
      taskId,
      sectionId,
      position,
    }: {
      taskId: string;
      sectionId?: string;
      position?: number;
    }) => {
      const payload = { sectionId, position };
      const current = queryClient.getQueryData<Task>(queryKeys.tasks.detail(taskId));
      if (isOffline() && workspaceId && current) {
        return Promise.resolve(
          queueEntityUpdate({
            workspaceId,
            entityType: "TASK",
            entityId: taskId,
            payload,
            current,
            meta: { projectId: current.projectId },
          })
        );
      }
      return tasksService.update(taskId, payload);
    },
    // Each board column is its own paginated cache (tasks.bySection), so a
    // cross-column move needs to be reflected in both the source and
    // destination column's cache directly — invalidateQueries alone leaves
    // the task sitting in the old column (refetch is paused while offline,
    // per networkMode: "online") instead of appearing to move at all.
    // Same-column reordering is left alone: the task never disappears there,
    // it just settles into its exact position once the next pull reconciles.
    onMutate: async ({ taskId, sectionId: toSectionId }) => {
      if (!toSectionId) return {};

      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.bySectionAll() });

      const previousEntries = moveTaskBetweenSectionCaches(queryClient, taskId, toSectionId);

      return { previousEntries };
    },
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      toast.success(
        isOffline()
          ? "Movimentação salva offline — será sincronizada quando a conexão voltar."
          : "Tarefa movida."
      );
    },
    onError: (error, _vars, context) => {
      restoreSectionEntries(queryClient, context?.previousEntries);
      toast.error(getErrorMessage(error));
    },
    // On failure too, so a rollback skipped because other task writes were in
    // flight still ends up matching the server.
    onSettled: () => scheduleTaskListsRefresh(queryClient),
  });
}

function pluralizeTasks(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

// Per-item failures of a bulk call, as messages a person can read.
function collectBulkFailures<T>(bulk: BulkResult<T>) {
  return bulk.results.flatMap((result) =>
    result.status === "FAILED" ? [getBulkItemErrorMessage(result.error)] : []
  );
}

/**
 * Moves several tasks to one column with a single `PATCH /tasks/bulk`. With a
 * `position` each task lands at `position + index` (keeping their relative
 * order); without one they are appended to the column in the order given. The
 * server applies the items one by one and a failure doesn't undo the others, so
 * the result reports what actually moved — callers can keep just the failed
 * ones selected.
 */
export function useMoveTasksToSectionMutation() {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationKey: TASK_MUTATION_KEY,
    mutationFn: async ({
      tasks,
      sectionId,
      position,
    }: {
      tasks: Task[];
      sectionId: string;
      position?: number;
    }) => {
      const payloadFor = (index: number) => ({
        sectionId,
        position: position === undefined ? undefined : position + index,
      });

      if (isOffline() && workspaceId) {
        for (const [index, task] of tasks.entries()) {
          const current = findCachedTask(queryClient, task.id) ?? task;
          const queued = queueEntityUpdate({
            workspaceId,
            entityType: "TASK",
            entityId: task.id,
            payload: payloadFor(index),
            current,
            meta: { projectId: current.projectId },
          });
          queryClient.setQueryData(queryKeys.tasks.detail(task.id), queued);
        }
        return { movedIds: tasks.map((task) => task.id), failures: [], queuedOffline: true };
      }

      const bulk = await tasksService.bulkUpdate(
        tasks.map((task, index) => ({ taskId: task.id, ...payloadFor(index) }))
      );
      const movedIds: string[] = [];
      for (const result of bulk.results) {
        if (result.status !== "SUCCESS") continue;
        movedIds.push(result.data.id);
        queryClient.setQueryData(queryKeys.tasks.detail(result.data.id), result.data);
      }
      return { movedIds, failures: collectBulkFailures(bulk), queuedOffline: false };
    },
    onMutate: async ({ tasks, sectionId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      const previousEntries = tasks.flatMap((task) =>
        moveTaskBetweenSectionCaches(queryClient, task.id, sectionId)
      );
      return { previousEntries };
    },
    onSuccess: ({ movedIds, failures, queuedOffline }) => {
      if (failures.length === 0) {
        toast.success(
          queuedOffline
            ? "Movimentação salva offline — será sincronizada quando a conexão voltar."
            : `${pluralizeTasks(movedIds.length, "tarefa movida", "tarefas movidas")}.`
        );
      } else if (movedIds.length === 0) {
        toast.error(failures[0]);
      } else {
        toast.warning(
          `${pluralizeTasks(movedIds.length, "tarefa movida", "tarefas movidas")}, mas ${pluralizeTasks(failures.length, "falhou", "falharam")}: ${failures[0]}`
        );
      }
    },
    onError: (error, _vars, context) => {
      restoreSectionEntries(queryClient, context?.previousEntries);
      toast.error(getErrorMessage(error));
    },
    // Whatever happened per task, the server's view wins: this also puts back
    // the ones that failed after the optimistic move above.
    onSettled: () => scheduleTaskListsRefresh(queryClient),
  });
}

/**
 * Deletes several tasks with a single `POST /tasks/bulk-delete` (a soft delete
 * that also takes every subtask along). Offline it queues one sync `DELETE` per
 * task instead. A task that's already gone (`TASK_NOT_FOUND` — e.g. the
 * subtask of another task in the same batch, removed by the cascade) counts as
 * deleted: it's the outcome that was asked for.
 */
export function useDeleteTasksMutation() {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationKey: TASK_MUTATION_KEY,
    mutationFn: async (tasks: Task[]) => {
      if (isOffline()) {
        if (!workspaceId) {
          throw new Error("Não foi possível apagar as tarefas: workspace indisponível.");
        }
        for (const task of tasks) {
          queueEntityDelete({
            workspaceId,
            entityType: "TASK",
            entityId: task.id,
            baseVersion: (findCachedTask(queryClient, task.id) ?? task).version,
            meta: { projectId: task.projectId, taskId: task.id },
          });
        }
        return {
          deletedIds: tasks.map((task) => task.id),
          deletedSubtaskIds: [] as string[],
          failures: [] as string[],
          queuedOffline: true,
        };
      }

      const bulk = await tasksService.bulkDelete(tasks.map((task) => task.id));
      const deletedIds: string[] = [];
      const deletedSubtaskIds: string[] = [];
      const failures: string[] = [];
      for (const result of bulk.results) {
        if (result.status === "SUCCESS") {
          deletedIds.push(result.data.id);
          deletedSubtaskIds.push(...result.data.deletedSubtaskIds);
        } else if (result.error.code === "TASK_NOT_FOUND" && result.taskId) {
          deletedIds.push(result.taskId);
        } else {
          failures.push(getBulkItemErrorMessage(result.error));
        }
      }
      return { deletedIds, deletedSubtaskIds, failures, queuedOffline: false };
    },
    onMutate: async (tasks) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      const previousEntries = removeTasksFromSectionCaches(
        queryClient,
        new Set(tasks.map((task) => task.id))
      );
      return { previousEntries };
    },
    onSuccess: ({ deletedIds, deletedSubtaskIds, failures, queuedOffline }) => {
      for (const taskId of [...deletedIds, ...deletedSubtaskIds]) {
        queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      }
      if (failures.length === 0) {
        toast.success(
          queuedOffline
            ? "Exclusão salva offline — será sincronizada quando a conexão voltar."
            : `${pluralizeTasks(deletedIds.length, "tarefa apagada", "tarefas apagadas")}.`
        );
      } else if (deletedIds.length === 0) {
        toast.error(failures[0]);
      } else {
        toast.warning(
          `${pluralizeTasks(deletedIds.length, "tarefa apagada", "tarefas apagadas")}, mas ${pluralizeTasks(failures.length, "falhou", "falharam")}: ${failures[0]}`
        );
      }
    },
    onError: (error, _tasks, context) => {
      restoreSectionEntries(queryClient, context?.previousEntries);
      toast.error(getErrorMessage(error));
    },
    // Puts back whatever the server didn't actually delete, and refreshes
    // counts and the subtask lists of the parents that lost a child.
    onSettled: (_data, _error, tasks) =>
      scheduleTaskListsRefresh(queryClient, {
        subtaskParentIds: tasks.map((task) => task.parentTaskId),
      }),
  });
}

/**
 * Creates several tasks in one project with a single `POST .../tasks/bulk`.
 * Inside one column they take their positions in the order given. Resolves with
 * the raw per-item result so the caller can tell which items failed — a task
 * that failed has no id, `index` is what matches it back to the input.
 */
export function useBulkCreateTasksMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: TASK_MUTATION_KEY,
    mutationFn: (tasks: CreateTaskRequest[]) => tasksService.bulkCreate(projectId, tasks),
    onSuccess: (bulk) => {
      const failures = collectBulkFailures(bulk);
      if (failures.length === 0) {
        toast.success(`${pluralizeTasks(bulk.succeeded, "tarefa criada", "tarefas criadas")}.`);
      } else if (bulk.succeeded === 0) {
        toast.error(failures[0]);
      } else {
        toast.warning(
          `${pluralizeTasks(bulk.succeeded, "tarefa criada", "tarefas criadas")}, mas ${pluralizeTasks(failures.length, "falhou", "falharam")}: ${failures[0]}`
        );
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: (bulk) =>
      scheduleTaskListsRefresh(queryClient, {
        subtaskParentIds: (bulk?.results ?? []).map((result) =>
          result.status === "SUCCESS" ? result.data.parentTaskId : null
        ),
      }),
  });
}

export function useChangeTaskStatusMutation(
  taskId: string,
  { silent = false }: TaskMutationOptions = {}
) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationKey: TASK_MUTATION_KEY,
    mutationFn: (payload: ChangeTaskStatusRequest) => {
      const current = findCachedTask(queryClient, taskId);
      if (isOffline() && workspaceId && current) {
        return Promise.resolve(
          queueEntityUpdate({
            workspaceId,
            entityType: "TASK",
            entityId: taskId,
            payload: payload as unknown as Record<string, unknown>,
            current,
            meta: { projectId: current.projectId },
          })
        );
      }
      return tasksService.changeStatus(taskId, payload);
    },
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(taskId), task);
      if (task.parentTaskId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.subtasks(task.parentTaskId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.subtasks(task.id) });
      if (silent) {
        patchTaskInLists(queryClient, task);
        return;
      }
      scheduleTaskListsRefresh(queryClient);
      toast.success(
        isOffline()
          ? "Status salvo offline — será sincronizado quando a conexão voltar."
          : "Status atualizado."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Same pattern as useUpdateTaskMutation: replace the cached task detail with the
// fresh server response (participantIds already up to date) and invalidate the
// lists that embed a Task, since a task's participants don't change list
// membership but callers still expect fresh data everywhere it's rendered.
export function useAddParticipantMutation(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => tasksService.addParticipant(taskId, userId),
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(taskId), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      toast.success("Participante adicionado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveParticipantMutation(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => tasksService.removeParticipant(taskId, userId),
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(taskId), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(task.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
      toast.success("Participante removido.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUploadAttachmentMutation(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => tasksService.uploadAttachment(taskId, file),
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(taskId), task);
      toast.success("Anexo enviado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDownloadAttachmentMutation(taskId: string) {
  return useMutation({
    mutationFn: async ({
      attachmentId,
      fileName,
    }: {
      attachmentId: string;
      fileName: string;
    }) => {
      const blob = await tasksService.downloadAttachment(taskId, attachmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
