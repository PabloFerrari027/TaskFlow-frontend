import type { ClientStatus } from "@/types/client";
import type { AnalyticsQuery } from "@/types/analytics";
import type { AiUsageFeature } from "@/types/ai-usage";
import type {
  AdminFolderTemplateFilters,
  FolderTemplateFilters,
} from "@/types/folder-template";
import type { SearchParams } from "@/types/search";
import type { ListChannelConversationsParams } from "@/types/assistant-channel";
import type { ListAssistantConversationsParams } from "@/types/assistant-conversation";
import type { ListCouponsParams } from "@/types/plan";
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
  // Saved in-app assistant chats (API.md § 16) — per signed-in user.
  assistantConversations: {
    root: () => ["assistant-conversations"] as const,
    list: (params: ListAssistantConversationsParams) =>
      ["assistant-conversations", "list", params] as const,
    messages: (conversationId: string) =>
      ["assistant-conversations", "messages", conversationId] as const,
  },
  // The assistant over WhatsApp & co. (API.md § 28) — per signed-in user.
  assistantChannels: {
    root: () => ["assistant-channels"] as const,
    list: () => ["assistant-channels", "list"] as const,
    conversations: (params: ListChannelConversationsParams) =>
      ["assistant-channels", "conversations", params] as const,
    messages: (conversationId: string) =>
      ["assistant-channels", "messages", conversationId] as const,
  },
  clients: {
    all: (params?: { page?: number; status?: ClientStatus; email?: string }) =>
      params ? (["clients", params] as const) : (["clients"] as const),
    detail: (clientId: string) => ["clients", clientId] as const,
    isSuperAdmin: () => ["clients", "is-super-admin"] as const,
    aiUsage: (
      clientId: string,
      params: { days: number; feature?: AiUsageFeature; page: number }
    ) => ["clients", clientId, "ai-usage", params] as const,
  },
  plans: {
    all: () => ["plans"] as const,
    mine: () => ["plans", "me"] as const,
    admin: {
      all: () => ["plans", "admin"] as const,
    },
  },
  coupons: {
    root: () => ["coupons"] as const,
    list: (params: ListCouponsParams) => ["coupons", "list", params] as const,
    redemptions: (couponId: string, page: number) =>
      ["coupons", "redemptions", couponId, page] as const,
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
  folders: {
    root: () => ["folders"] as const,
    all: (workspaceId: string) => ["folders", "workspace", workspaceId] as const,
    detail: (folderId: string) => ["folders", folderId] as const,
    members: (folderId: string) => ["folders", folderId, "members"] as const,
    invitations: (folderId: string, page?: number) =>
      page
        ? (["folders", folderId, "invitations", { page }] as const)
        : (["folders", folderId, "invitations"] as const),
    invitationPreview: (token: string) =>
      ["folders", "invitations", token, "preview"] as const,
  },
  items: {
    root: () => ["items"] as const,
    all: (folderId: string, page?: number) =>
      page
        ? (["items", "folder", folderId, { page }] as const)
        : (["items", "folder", folderId] as const),
    detail: (itemId: string) => ["items", itemId] as const,
    subitems: (itemId: string) => ["items", itemId, "subitems"] as const,
    customFieldValues: (itemId: string) =>
      ["items", itemId, "custom-field-values"] as const,
    dependencies: (itemId: string) => ["items", itemId, "dependencies"] as const,
    // Under the `items` root, so every item-wide invalidation refreshes it too.
    timeline: (folderId: string) => ["items", "timeline", folderId] as const,
    trash: (folderId: string, page?: number) =>
      page
        ? (["items", "trash", folderId, { page }] as const)
        : (["items", "trash", folderId] as const),
    // Every folder's trash, when the folder isn't known (capture undo).
    trashAll: () => ["items", "trash"] as const,
    // Binary downloads (attachments, covers) deliberately live under their own
    // root, not `["items", itemId, ...]`: the bulk `items` invalidations run on
    // every realtime signal / non-empty pull, and would otherwise re-download
    // every visible cover and attachment blob each time.
    attachmentFile: (itemId: string, attachmentId: string) =>
      ["item-files", itemId, "attachments", attachmentId] as const,
    // `version` is part of the key: any edit bumps it, and that's the only
    // signal a cover was replaced by someone else (the URL never changes).
    cover: (itemId: string, version?: number) =>
      version === undefined
        ? (["item-files", itemId, "cover"] as const)
        : (["item-files", itemId, "cover", version] as const),
    // Untyped `["items", "section"]` prefix (no sectionId) is used to
    // invalidate every column's item list at once when an item is created
    // or moved, since we don't always know which section(s) were affected.
    bySectionAll: () => ["items", "section"] as const,
    // Same idea for every folder's item list, when the folder isn't known
    // (e.g. a realtime change signal only carries the item id).
    byFolderAll: () => ["items", "folder"] as const,
    bySection: (sectionId: string, page?: number) =>
      page
        ? (["items", "section", sectionId, { page }] as const)
        : (["items", "section", sectionId] as const),
  },
  dataJobs: {
    detail: (jobId: string) => ["data-jobs", jobId] as const,
  },
  intakeForms: {
    all: (folderId: string) => ["intake-forms", folderId] as const,
    // Anonymous: its own root, nothing signed-in reuses it.
    public: (token: string) => ["public-intake-form", token] as const,
  },
  savedViews: {
    all: (folderId: string) => ["saved-views", folderId] as const,
  },
  approvals: {
    root: () => ["approvals"] as const,
    item: (itemId: string) => ["approvals", "item", itemId] as const,
    pending: () => ["approvals", "pending"] as const,
  },
  timeTracking: {
    root: () => ["time-tracking"] as const,
    running: () => ["time-tracking", "running"] as const,
    item: (itemId: string, page?: number) =>
      page
        ? (["time-tracking", "item", itemId, { page }] as const)
        : (["time-tracking", "item", itemId] as const),
    report: (folderId: string, params: { groupBy: string; from?: string }) =>
      ["time-tracking", "report", folderId, params] as const,
  },
  // Never cached server-side either: nextRunAt/lastRunAt/enabled change on their own.
  recurringItems: {
    all: (folderId: string) => ["recurring-items", folderId] as const,
    preview: (folderId: string, schedule: unknown) =>
      ["recurring-items", folderId, "preview", stableStringify(schedule)] as const,
  },
  // A folder's custom statuses (etapas). Configuration, not synced.
  statuses: {
    all: (folderId: string) => ["statuses", "folder", folderId] as const,
    byFolderAll: () => ["statuses", "folder"] as const,
  },
  sections: {
    all: (folderId: string) => ["sections", "folder", folderId] as const,
    byFolderAll: () => ["sections", "folder"] as const,
  },
  customFields: {
    all: (folderId: string) => ["custom-fields", "folder", folderId] as const,
    byFolderAll: () => ["custom-fields", "folder"] as const,
  },
  comments: {
    all: (itemId: string, page?: number) =>
      page
        ? (["comments", "item", itemId, { page }] as const)
        : (["comments", "item", itemId] as const),
    byItemAll: () => ["comments", "item"] as const,
  },
  activity: {
    root: () => ["activity"] as const,
    workspace: (workspaceId: string, page?: number) =>
      page
        ? (["activity", "workspace", workspaceId, { page }] as const)
        : (["activity", "workspace", workspaceId] as const),
    folder: (folderId: string, page?: number) =>
      page
        ? (["activity", "folder", folderId, { page }] as const)
        : (["activity", "folder", folderId] as const),
    item: (itemId: string, page?: number) =>
      page
        ? (["activity", "item", itemId, { page }] as const)
        : (["activity", "item", itemId] as const),
  },
  aiUsage: {
    me: (params: { days: number; feature?: AiUsageFeature; page: number }) =>
      ["ai-usage", "me", params] as const,
    // Total since the start of a quota window (API.md § 23). Keyed on the
    // window's start, so crossing a UTC boundary starts a fresh entry.
    // Nested under `["ai-usage", "me"]` so invalidating that prefix refreshes it too.
    window: (window: "day" | "week" | "month", from: string) =>
      ["ai-usage", "me", "window", window, from] as const,
  },
  // The system catalog is global (API.md § 26): no workspaceId in its key, so
  // switching workspace never refetches it — only `workspace` depends on one.
  // The filter objects go in as is — TanStack hashes object keys sorted, and
  // drops `undefined` fields.
  folderTemplates: {
    all: () => ["folder-templates"] as const,
    lists: () => ["folder-templates", "list"] as const,
    list: (filters: FolderTemplateFilters) =>
      ["folder-templates", "list", filters] as const,
    categories: () => ["folder-templates", "categories"] as const,
    // Answers differ per user (private templates 404 for non-members), so it is never
    // seeded from a list cache.
    detail: (templateId: string) => ["folder-templates", "detail", templateId] as const,
    workspace: (workspaceId: string) =>
      ["folder-templates", "workspace", workspaceId] as const,
    versions: (templateId: string) => ["folder-templates", "versions", templateId] as const,
    instantiation: (instantiationId: string) =>
      ["folder-templates", "instantiation", instantiationId] as const,
    // Binary images (cover / screenshot N). The URL never changes when an
    // image is replaced, so `stamp` (the template's `updatedAt`) is in the key.
    image: (templateId: string, image: "cover" | number, stamp?: string) =>
      stamp === undefined
        ? (["template-images", templateId, image] as const)
        : (["template-images", templateId, image, stamp] as const),
    adminLists: () => ["folder-templates", "admin"] as const,
    adminList: (filters: AdminFolderTemplateFilters) =>
      ["folder-templates", "admin", filters] as const,
  },
  // Per user, not per workspace: the inbox mixes every workspace (filtered
  // client-side by the `workspaceId` param when asked).
  notifications: {
    root: () => ["notifications"] as const,
    list: (params: { unreadOnly?: boolean; workspaceId?: string; page?: number }) =>
      ["notifications", "list", params] as const,
    unreadCount: (workspaceId?: string) => ["notifications", "unread-count", workspaceId ?? null] as const,
    preferences: () => ["notifications", "preferences"] as const,
  },
  search: {
    root: () => ["search"] as const,
    results: (workspaceId: string, params: SearchParams) =>
      ["search", workspaceId, params] as const,
  },
  automations: {
    all: (workspaceId: string) => ["automations", "workspace", workspaceId] as const,
  },
  developers: {
    apiKeys: (workspaceId: string) => ["developers", "api-keys", workspaceId] as const,
    webhookEndpoints: (workspaceId: string) =>
      ["developers", "webhook-endpoints", workspaceId] as const,
    webhookDeliveries: (webhookEndpointId: string, page?: number) =>
      page
        ? (["developers", "webhook-deliveries", webhookEndpointId, { page }] as const)
        : (["developers", "webhook-deliveries", webhookEndpointId] as const),
  },
  dashboardPages: {
    all: (workspaceId: string) => ["dashboard-pages", "workspace", workspaceId] as const,
    // Every page detail shares this prefix (and nothing else does): their
    // charts come back already executed, so any item/folder/section change
    // makes all of them stale at once.
    details: () => ["dashboard-pages", "detail"] as const,
    detail: (pageId: string) => ["dashboard-pages", "detail", pageId] as const,
    accessGrants: (pageId: string) => ["dashboard-pages", "access-grants", pageId] as const,
    // Anonymous views live under their own root: nothing authenticated ever
    // invalidates or reuses them.
    shared: (kind: "public" | "guest", token: string) =>
      ["shared-dashboard-pages", kind, token] as const,
  },
  analytics: {
    root: () => ["analytics"] as const,
    // Requests are built with different property orders across the
    // specialized hooks in use-analytics.ts; serialize with sorted keys so
    // logically-identical queries always hash to the same cache entry.
    query: (request: AnalyticsQuery) =>
      ["analytics", "query", stableStringify(request)] as const,
  },
  // The folder's Estatísticas tab. Its own root (not `analytics`): each
  // indicator's request depends on "now" (date filters), so it is keyed by
  // what it shows, not by its body. Every item change invalidates the whole
  // root — an item in a sub-folder also moves its ancestors' numbers.
  folderStats: {
    root: () => ["folder-stats"] as const,
    indicator: (folderId: string, indicator: string) =>
      ["folder-stats", folderId, indicator] as const,
  },
  // The Início page: the signed-in user's own item numbers in a workspace.
  // Same rules as folderStats (keyed by indicator, "now" read at request
  // time) and invalidated at the same points — every item change.
  home: {
    root: () => ["home"] as const,
    indicator: (workspaceId: string, userId: string, indicator: string) =>
      ["home", workspaceId, userId, indicator] as const,
  },
} as const;
