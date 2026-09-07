import type { ClientStatus } from "@/types/client";

export const queryKeys = {
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
    // Untyped `["tasks", "section"]` prefix (no sectionId) is used to
    // invalidate every column's task list at once when a task is created
    // or moved, since we don't always know which section(s) were affected.
    bySectionAll: () => ["tasks", "section"] as const,
    bySection: (sectionId: string, page?: number) =>
      page
        ? (["tasks", "section", sectionId, { page }] as const)
        : (["tasks", "section", sectionId] as const),
  },
  sections: {
    all: (projectId: string) => ["sections", "project", projectId] as const,
  },
  customFields: {
    all: (projectId: string) => ["custom-fields", "project", projectId] as const,
  },
  comments: {
    all: (taskId: string, page?: number) =>
      page
        ? (["comments", "task", taskId, { page }] as const)
        : (["comments", "task", taskId] as const),
  },
  activity: {
    workspace: (workspaceId: string, page?: number) =>
      page
        ? (["activity", "workspace", workspaceId, { page }] as const)
        : (["activity", "workspace", workspaceId] as const),
    task: (taskId: string, page?: number) =>
      page
        ? (["activity", "task", taskId, { page }] as const)
        : (["activity", "task", taskId] as const),
  },
} as const;
