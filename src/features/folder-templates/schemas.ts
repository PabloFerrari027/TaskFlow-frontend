import { z } from "zod";
import {
  FOLDER_TEMPLATE_CATEGORIES,
  FOLDER_TEMPLATE_LANGUAGES,
  FOLDER_TEMPLATE_LEVELS,
  type TemplateListingFields,
} from "@/types/folder-template";

// Shared by "Salvar como modelo", "Editar modelo" and saving an AI draft.
// The listing details (tags, level, language, duration) only show where the
// API takes them — never on "save as template".
export const templateListingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome precisa ter pelo menos 2 caracteres.")
    .max(120, "Use no máximo 120 caracteres."),
  description: z.string().max(2000, "Use no máximo 2000 caracteres."),
  category: z.enum(FOLDER_TEMPLATE_CATEGORIES, { error: "Escolha uma categoria." }),
  // Comma-separated in the form; up to 10, lowercase, 30 characters each.
  tags: z
    .string()
    .optional()
    .refine((value) => splitTags(value).length <= 10, "Use no máximo 10 tags.")
    .refine(
      (value) => splitTags(value).every((tag) => tag.length <= 30),
      "Cada tag pode ter até 30 caracteres."
    ),
  level: z.enum([...FOLDER_TEMPLATE_LEVELS, ""]).optional(),
  language: z.enum(FOLDER_TEMPLATE_LANGUAGES).optional(),
  estimatedDurationDays: z
    .string()
    .optional()
    .refine(
      (value) => !value || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 3650),
      "Use um número de dias entre 1 e 3650."
    ),
});

export type TemplateListingFormValues = z.infer<typeof templateListingSchema>;

export function splitTags(value: string | undefined) {
  return [
    ...new Set(
      (value ?? "")
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}

function listingDetails(values: TemplateListingFormValues): TemplateListingFields {
  // Absent fields weren't on the form — leave them out of the request.
  if (values.tags === undefined && values.level === undefined) return {};
  return {
    tags: splitTags(values.tags),
    level: values.level ? values.level : null,
    language: values.language,
    estimatedDurationDays: values.estimatedDurationDays ? Number(values.estimatedDurationDays) : null,
  };
}

// On edit an emptied description must be sent as `null` (clears it); on
// save it is simply left out.
export function toListingRequest(values: TemplateListingFormValues, mode: "save" | "edit") {
  return {
    name: values.name,
    description: values.description.trim() || (mode === "edit" ? null : undefined),
    category: values.category,
    ...listingDetails(values),
  };
}
