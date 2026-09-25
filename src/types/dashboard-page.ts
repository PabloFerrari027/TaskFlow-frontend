import type { AnalyticsQuery, AnalyticsResult } from "./analytics";

export type DashboardPageVisibility = "PRIVATE" | "RESTRICTED" | "WORKSPACE" | "PUBLIC";

export type DashboardChartType = "BAR" | "PIE" | "LINE" | "NUMBER";

// One row of GET /workspaces/:workspaceId/dashboard-pages. Never carries the
// public token itself — only whether a working public link exists right now.
export interface DashboardPageSummary {
  id: string;
  workspaceId: string;
  // null for the page seeded automatically when a workspace is created.
  createdBy: string | null;
  name: string;
  visibility: DashboardPageVisibility;
  hasActivePublicLink: boolean;
  createdAt: string;
  updatedAt: string;
}

// Same shape as AnalyticsQuery minus `workspaceId`: the backend always takes
// it from the page, never from the client.
export type ChartQuery = Omit<AnalyticsQuery, "workspaceId">;

// Grid units (12 columns), not pixels.
export interface ChartPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChartDefinition {
  id: string;
  pageId: string;
  name: string;
  chartType: DashboardChartType;
  query: ChartQuery;
  position: ChartPosition;
}

export interface ChartWithResult extends ChartDefinition {
  result: AnalyticsResult;
}

// GET /pages/public/:token and GET /pages/guest/:token — deliberately minimal.
export interface DashboardPageView {
  id: string;
  name: string;
  charts: ChartWithResult[];
}

// GET /workspaces/:workspaceId/dashboard-pages/:pageId — `canEdit` is the
// same rule the write endpoints enforce; the UI never recomputes it.
export interface AuthenticatedDashboardPageView extends DashboardPageView {
  visibility: DashboardPageVisibility;
  createdBy: string | null;
  canEdit: boolean;
}

export interface CreateDashboardPageRequest {
  name: string;
  visibility?: DashboardPageVisibility;
}

export interface UpdateDashboardPageRequest {
  name?: string;
  visibility?: DashboardPageVisibility;
}

// Returned only by regenerate-public-token — the one moment the plaintext
// token exists; no GET ever returns it again.
export interface PublicAccessTokenResponse {
  publicAccessToken: string;
}

export interface PageAccessGrant {
  id: string;
  pageId: string;
  // Exactly one of userId (workspace member) / email (external guest).
  userId: string | null;
  email: string | null;
  invitedBy: string;
  invitedAt: string;
  revokedAt: string | null;
}

export type CreateAccessGrantRequest = { userId: string } | { email: string };

export interface ChartDefinitionRequest {
  name: string;
  chartType: DashboardChartType;
  query: ChartQuery;
  position: ChartPosition;
}
