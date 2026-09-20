export interface Section {
  id: string;
  projectId: string;
  // null for a root column; otherwise the parent section within the project.
  parentId: string | null;
  name: string;
  position: number;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionRequest {
  name: string;
  parentId?: string;
}

export interface MoveSectionRequest {
  // null promotes the section to a root column of the project.
  parentId: string | null;
  position?: number;
}

export interface UpdateSectionRequest {
  name?: string;
  position?: number;
}
