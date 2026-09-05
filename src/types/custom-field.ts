export type CustomFieldType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "CHECKBOX"
  | "PEOPLE";

export interface CustomFieldDefinition {
  id: string;
  projectId: string;
  name: string;
  type: CustomFieldType;
  options: string[] | null;
  archived: boolean;
  version: number;
}

export interface CreateCustomFieldDefinitionRequest {
  name: string;
  type: CustomFieldType;
  options?: string[];
}

export interface UpdateCustomFieldOptionsRequest {
  options: string[];
}

export type CustomFieldValue =
  | string
  | number
  | boolean
  | string[]
  | null;

export interface TaskCustomFieldValue {
  id: string;
  taskId: string;
  fieldDefinitionId: string;
  value: CustomFieldValue;
  updatedAt: string;
}

export interface SetTaskCustomFieldValueRequest {
  value: CustomFieldValue;
}
