export const queryKeys = {
  sessions: {
    all: () => ["sessions"] as const,
  },
  workspaces: {
    all: () => ["workspaces"] as const,
    detail: (workspaceId: string) => ["workspaces", workspaceId] as const,
    invitations: (workspaceId: string) =>
      ["workspaces", workspaceId, "invitations"] as const,
    invitationPreview: (token: string) =>
      ["workspaces", "invitations", token, "preview"] as const,
  },
  projects: {
    all: (workspaceId: string) => ["projects", "workspace", workspaceId] as const,
    detail: (projectId: string) => ["projects", projectId] as const,
    members: (projectId: string) => ["projects", projectId, "members"] as const,
    invitations: (projectId: string) =>
      ["projects", projectId, "invitations"] as const,
    invitationPreview: (token: string) =>
      ["projects", "invitations", token, "preview"] as const,
  },
  tasks: {
    all: (projectId: string) => ["tasks", "project", projectId] as const,
    detail: (taskId: string) => ["tasks", taskId] as const,
    subtasks: (taskId: string) => ["tasks", taskId, "subtasks"] as const,
    customFieldValues: (taskId: string) =>
      ["tasks", taskId, "custom-field-values"] as const,
  },
  customFields: {
    all: (projectId: string) => ["custom-fields", "project", projectId] as const,
  },
} as const;
