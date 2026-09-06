import type { PaginationParams } from "@/types/common";

export type PlatformRole = "CUSTOMER" | "SUPER_ADMIN";
export type ClientStatus = "ACTIVE" | "DISABLED" | "CLOSED";

export interface ClientListItem {
  id: string;
  email: string;
  role: PlatformRole;
  status: ClientStatus;
  createdAt: string;
}

export interface ClientDetail extends ClientListItem {
  ownedWorkspacesCount: number;
  activeSessionsCount: number;
  googleLinked: boolean;
}

export interface ListClientsParams extends PaginationParams {
  status?: ClientStatus;
  email?: string;
}
