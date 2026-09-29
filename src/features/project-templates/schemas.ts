import { z } from "zod";
import { PROJECT_TEMPLATE_CATEGORIES } from "@/types/project-template";

export const instantiateTemplateSchema = z.object({
  name: z.string().trim().min(2, "O nome precisa ter pelo menos 2 caracteres."),
});

export type InstantiateTemplateFormValues = z.infer<typeof instantiateTemplateSchema>;

// Shared by "Salvar como modelo" and "Editar modelo".
export const templateListingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome precisa ter pelo menos 2 caracteres.")
    .max(120, "Use no máximo 120 caracteres."),
  description: z.string().max(2000, "Use no máximo 2000 caracteres."),
  category: z.enum(PROJECT_TEMPLATE_CATEGORIES, { error: "Escolha uma categoria." }),
});

export type TemplateListingFormValues = z.infer<typeof templateListingSchema>;

// On edit an emptied description must be sent as `null` (clears it); on
// save it is simply left out.
export function toListingRequest(values: TemplateListingFormValues, mode: "save" | "edit") {
  return {
    name: values.name,
    description: values.description.trim() || (mode === "edit" ? null : undefined),
    category: values.category,
  };
}

export const moderationReasonSchema = z.object({
  reason: z.string().max(500, "Use no máximo 500 caracteres."),
});

export type ModerationReasonFormValues = z.infer<typeof moderationReasonSchema>;
