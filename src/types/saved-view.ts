import type { TaskPriority, TaskStatus } from "@/types/task";

export type SavedViewType = "LIST" | "BOARD" | "CALENDAR" | "TIMELINE" | "TABLE";
/** PERSONAL = only the owner sees it; SHARED = everyone in the project. */
export type SavedViewScope = "PERSONAL" | "SHARED";

/** Native task fields, or a custom field as `cf:<id>`. */
export type SavedViewFieldRef = string;

/**
 * The single shape of a view's configuration (`saved-view-config.ts` on the
 * backend, validated strictly — unknown keys are refused). The client applies it.
 */
export interface SavedViewConfig {
  filters: {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    assigneeIds?: string[];
    /** "Only mine", resolved with whoever opens the view. */
    assignedToMe?: boolean;
    unassigned?: boolean;
    sectionIds?: string[];
    isMilestone?: boolean;
    /** ISO datetimes. */
    dueFrom?: string;
    dueTo?: string;
    /** Relative window from today, in days. */
    dueWithinDays?: number;
    text?: string;
  };
  sort: { field: SavedViewFieldRef; direction: "asc" | "desc" }[];
  groupBy: SavedViewFieldRef | null;
  columns: SavedViewFieldRef[];
  showSubtasks: boolean;
  showCompleted: boolean;
}

export interface SavedView {
  id: string;
  projectId: string;
  ownerId: string;
  scope: SavedViewScope;
  name: string;
  viewType: SavedViewType;
  config: SavedViewConfig;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedViewRequest {
  name: string;
  viewType: SavedViewType;
  scope?: SavedViewScope;
  config?: Partial<SavedViewConfig>;
}

export interface UpdateSavedViewRequest {
  name?: string;
  viewType?: SavedViewType;
  scope?: SavedViewScope;
  config?: Partial<SavedViewConfig>;
  position?: number;
}
