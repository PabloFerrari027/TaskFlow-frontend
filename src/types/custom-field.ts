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
  folderId: string;
  name: string;
  type: CustomFieldType;
  options: string[] | null;
  /** Color (#RRGGBB) per select option; options without an entry have none. */
  optionColors?: Record<string, string> | null;
  archived: boolean;
  version: number;
}

export interface CreateCustomFieldDefinitionRequest {
  name: string;
  type: CustomFieldType;
  options?: string[];
  optionColors?: Record<string, string> | null;
}

export interface UpdateCustomFieldOptionsRequest {
  options: string[];
  /** Applied after the options, so renamed options keep their colors. */
  optionColors?: Record<string, string> | null;
}

export interface UpdateCustomFieldDetailsRequest {
  optionColors?: Record<string, string> | null;
}

export type CustomFieldValue =
  | string
  | number
  | boolean
  | string[]
  | null;

export interface ItemCustomFieldValue {
  id: string;
  itemId: string;
  fieldDefinitionId: string;
  value: CustomFieldValue;
  updatedAt: string;
}

export interface SetItemCustomFieldValueRequest {
  value: CustomFieldValue;
}
