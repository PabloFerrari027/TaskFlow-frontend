import { z } from "zod";
import { PROJECT_TEMPLATE_CATEGORIES } from "@/types/project-template";

export const MIN_PRICE_CENTS = 100;
export const MAX_PRICE_CENTS = 100_000;

// "12,50", "12.50", "1.000,00" and "R$ 5" all mean what a Brazilian user
// would expect. Returns null when it isn't a number at all.
export function parseReaisToCents(value: string): number | null {
  const cleaned = value.replace(/[R$\s]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

export function centsToReaisInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export const instantiateTemplateSchema = z.object({
  name: z.string().trim().min(2, "O nome precisa ter pelo menos 2 caracteres."),
});

export type InstantiateTemplateFormValues = z.infer<typeof instantiateTemplateSchema>;

// Shared by "Publicar como modelo" and "Editar anúncio". The price stays a
// string in the form (what the user typed); `toListingRequest` converts it.
export const templateListingSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "O nome precisa ter pelo menos 2 caracteres.")
      .max(120, "Use no máximo 120 caracteres."),
    description: z.string().max(2000, "Use no máximo 2000 caracteres."),
    category: z.enum(PROJECT_TEMPLATE_CATEGORIES, { error: "Escolha uma categoria." }),
    isPaid: z.boolean(),
    price: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.isPaid) return;
    const cents = parseReaisToCents(values.price);
    if (cents === null) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Informe um valor, como 19,90." });
      return;
    }
    if (cents < MIN_PRICE_CENTS || cents > MAX_PRICE_CENTS) {
      ctx.addIssue({
        code: "custom",
        path: ["price"],
        message: "O preço precisa ficar entre R$ 1,00 e R$ 1.000,00.",
      });
    }
  });

export type TemplateListingFormValues = z.infer<typeof templateListingSchema>;

// On edit an emptied description must be sent as `null` (clears it); on
// publish it is simply left out.
export function toListingRequest(values: TemplateListingFormValues, mode: "publish" | "edit") {
  return {
    name: values.name,
    description: values.description.trim() || (mode === "edit" ? null : undefined),
    category: values.category,
    priceCents: values.isPaid ? (parseReaisToCents(values.price) ?? 0) : 0,
  };
}

export const moderationReasonSchema = z.object({
  reason: z.string().max(500, "Use no máximo 500 caracteres."),
});

export type ModerationReasonFormValues = z.infer<typeof moderationReasonSchema>;
