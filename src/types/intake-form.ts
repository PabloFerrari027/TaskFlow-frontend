export const INTAKE_FIELD_TYPES = ["TEXT", "LONG_TEXT", "EMAIL", "NUMBER", "DATE", "SELECT"] as const;
export type IntakeFieldType = (typeof INTAKE_FIELD_TYPES)[number];

/** Where an answer goes in the item. Without one, it is added to the description as "Label: value". */
export type IntakeFieldTarget = "title" | "description" | "dueDate" | "priority";

export interface IntakeFormField {
  /** snake_case, unique in the form. */
  key: string;
  label: string;
  type: IntakeFieldType;
  required: boolean;
  /** SELECT only. */
  options?: string[];
  mapsTo?: IntakeFieldTarget;
  helpText?: string;
}

export interface IntakeForm {
  id: string;
  folderId: string;
  name: string;
  description: string | null;
  /** Off: the public link answers 404. */
  isActive: boolean;
  publicToken: string;
  /** `/forms/<token>` — the API's path, also this app's public page. */
  publicPath: string;
  targetSectionId: string | null;
  defaultAssigneeId: string | null;
  fields: IntakeFormField[];
  submissionCount: number;
  lastSubmittedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicIntakeForm {
  name: string;
  description: string | null;
  fields: Omit<IntakeFormField, "mapsTo">[];
}

export interface SaveIntakeFormRequest {
  name: string;
  description?: string | null;
  fields: IntakeFormField[];
  targetSectionId?: string | null;
  defaultAssigneeId?: string | null;
  isActive?: boolean;
}
