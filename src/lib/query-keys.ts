import type { ClientStatus } from "@/types/client";
import type { AnalyticsQuery } from "@/types/analytics";
import type { AiUsageFeature } from "@/types/ai-usage";
import { stableStringify } from "@/lib/utils";

export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  users: {
    photo: (userId: string) => ["users", userId, "photo"] as const,
  },
  sessions: {
    all: () => ["sessions"] as const,
  },
  clients: {
    all: (params?: { page?: number; status?: ClientStatus; email?: string }) =>
      params ? (["clients", params] as const) : (["clients"] as const),
    detail: (clientId: string) => ["clients", clientId] as const,
    isSuperAdmin: () => ["clients", "is-super-admin"] as const,
  },
  workspaces: {
    all: () => ["workspaces"] as const,
    detail: (workspaceId: string) => ["workspaces", workspaceId] as const,
    // `page` is only included when paging through this list (see Pager usage);
    // omitting it keeps `invalidateQueries` matching every page as a prefix.
    invitations: (workspaceId: string, page?: number) =>
      page
        ? (["workspaces", workspaceId, "invitations", { page }] as const)
        : (["workspaces", workspaceId, "invitations"] as const),
    invitationPreview: (token: string) =>
      ["workspaces", "invitations", token, "preview"] as const,
  },
  projects: {
    all: (workspaceId: string) => ["projects", "workspace", workspaceId] as const,
    detail: (projectId: string) => ["projects", projectId] as const,
    members: (projectId: string) => ["projects", projectId, "members"] as const,
    invitations: (projectId: string, page?: number) =>
      page
        ? (["projects", projectId, "invitations", { page }] as const)
        : (["projects", projectId, "invitations"] as const),
    invitationPreview: (token: string) =>
      ["projects", "invitations", token, "preview"] as const,
  },
  tasks: {
    all: (projectId: string, page?: number) =>
      page
        ? (["tasks", "project", projectId, { page }] as const)
        : (["tasks", "project", projectId] as const),
    detail: (taskId: string) => ["tasks", taskId] as const,
    subtasks: (taskId: string) => ["tasks", taskId, "subtasks"] as const,
    customFieldValues: (taskId: string) =>
      ["tasks", taskId, "custom-field-values"] as const,
    // Binary downloads (attachments, covers) deliberately live under their own
    // root, not `["tasks", taskId, ...]`: the bulk `tasks` invalidations run on
    // every realtime signal / non-empty pull, and would otherwise re-download
    // every visible cover and attachment blob each time.
    attachmentFile: (taskId: string, attachmentId: string) =>
      ["task-files", taskId, "attachments", attachmentId] as const,
    // `version` is part of the key: any edit bumps it, and that's the only
    // signal a cover was replaced by someone else (the URL never changes).
    cover: (taskId: string, version?: number) =>
      version === undefined
        ? (["task-files", taskId, "cover"] as const)
        : (["task-files", taskId, "cover", version] as const),
    // Untyped `["tasks", "section"]` prefix (no sectionId) is used to
    // invalidate every column's task list at once when a task is created
    // or moved, since we don't always know which section(s) were affected.
    bySectionAll: () => ["tasks", "section"] as const,
    // Same idea for every project's task list, when the project isn't known
    // (e.g. a realtime change signal only carries the task id).
    byProjectAll: () => ["tasks", "project"] as const,
    bySection: (sectionId: string, page?: number) =>
      page
        ? (["tasks", "section", sectionId, { page }] as const)
        : (["tasks", "section", sectionId] as const),
  },
  sections: {
    all: (projectId: string) => ["sections", "project", projectId] as const,
    byProjectAll: () => ["sections", "project"] as const,
  },
  customFields: {
    all: (projectId: string) => ["custom-fields", "project", projectId] as const,
    byProjectAll: () => ["custom-fields", "project"] as const,
  },
  comments: {
    all: (taskId: string, page?: number) =>
      page
        ? (["comments", "task", taskId, { page }] as const)
        : (["comments", "task", taskId] as const),
    byTaskAll: () => ["comments", "task"] as const,
  },
  activity: {
    root: () => ["activity"] as const,
    workspace: (workspaceId: string, page?: number) =>
      page
        ? (["activity", "workspace", workspaceId, { page }] as const)
        : (["activity", "workspace", workspaceId] as const),
    task: (taskId: string, page?: number) =>
      page
        ? (["activity", "task", taskId, { page }] as const)
        : (["activity", "task", taskId] as const),
  },
  aiUsage: {
    me: (params: { days: number; feature?: AiUsageFeature; page: number }) =>
      ["ai-usage", "me", params] as const,
  },
  automations: {
    all: (workspaceId: string) => ["automations", "workspace", workspaceId] as const,
  },
  analytics: {
    root: () => ["analytics"] as const,
    // Requests are built with different property orders across the
    // specialized hooks in use-analytics.ts; serialize with sorted keys so
    // logically-identical queries always hash to the same cache entry.
    query: (request: AnalyticsQuery) =>
      ["analytics", "query", stableStringify(request)] as const,
  },
} as const;
