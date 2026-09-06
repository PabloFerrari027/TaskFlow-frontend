export interface Section {
  id: string;
  projectId: string;
  name: string;
  position: number;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionRequest {
  name: string;
}

export interface UpdateSectionRequest {
  name?: string;
  position?: number;
}
