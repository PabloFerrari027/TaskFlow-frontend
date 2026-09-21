"use client";

import * as React from "react";
import type { Task } from "@/types/task";

interface TaskSelectionValue {
  /** Selected tasks in the order they were picked. */
  tasks: Task[];
  count: number;
  isSelected: (taskId: string) => boolean;
  toggle: (task: Task) => void;
  select: (tasks: Task[]) => void;
  deselect: (taskIds: string[]) => void;
  clear: () => void;
}

const TaskSelectionContext = React.createContext<TaskSelectionValue | null>(null);

/**
 * Selection is shared by every column of the board (and the dedicated column
 * page), because a bulk action is about the tasks picked across all of them.
 * Tasks are stored as snapshots rather than ids: bulk actions need each one's
 * section and version even when its column isn't on screen anymore.
 */
export function TaskSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = React.useState<ReadonlyMap<string, Task>>(new Map());

  const toggle = React.useCallback((task: Task) => {
    setSelected((current) => {
      const next = new Map(current);
      if (!next.delete(task.id)) next.set(task.id, task);
      return next;
    });
  }, []);

  const select = React.useCallback((tasks: Task[]) => {
    setSelected((current) => {
      const next = new Map(current);
      for (const task of tasks) if (!next.has(task.id)) next.set(task.id, task);
      return next;
    });
  }, []);

  const deselect = React.useCallback((taskIds: string[]) => {
    setSelected((current) => {
      const next = new Map(current);
      for (const taskId of taskIds) next.delete(taskId);
      return next.size === current.size ? current : next;
    });
  }, []);

  const clear = React.useCallback(() => setSelected(new Map()), []);

  const value = React.useMemo<TaskSelectionValue>(
    () => ({
      tasks: [...selected.values()],
      count: selected.size,
      isSelected: (taskId) => selected.has(taskId),
      toggle,
      select,
      deselect,
      clear,
    }),
    [selected, toggle, select, deselect, clear]
  );

  return <TaskSelectionContext value={value}>{children}</TaskSelectionContext>;
}

export function useTaskSelection() {
  const context = React.use(TaskSelectionContext);
  if (!context) {
    throw new Error("useTaskSelection must be used inside a TaskSelectionProvider");
  }
  return context;
}
