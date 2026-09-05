import { z } from "zod";

export const CUSTOM_FIELD_TYPES = [
  "TEXT",
  "NUMBER",
  "DATE",
  "SINGLE_SELECT",
  "MULTI_SELECT",
  "CHECKBOX",
  "PEOPLE",
] as const;

export const CUSTOM_FIELD_TYPE_LABEL: Record<(typeof CUSTOM_FIELD_TYPES)[number], string> = {
  TEXT: "Texto",
  NUMBER: "Número",
  DATE: "Data",
  SINGLE_SELECT: "Seleção única",
  MULTI_SELECT: "Seleção múltipla",
  CHECKBOX: "Caixa de seleção",
  PEOPLE: "Pessoas",
};

const SELECT_TYPES = ["SINGLE_SELECT", "MULTI_SELECT"];

export const createCustomFieldSchema = z
  .object({
    name: z.string().min(2, "O nome precisa ter pelo menos 2 caracteres."),
    type: z.enum(CUSTOM_FIELD_TYPES),
    optionsText: z.string().optional(),
  })
  .refine(
    (data) =>
      !SELECT_TYPES.includes(data.type) ||
      (data.optionsText ?? "").split("\n").some((line) => line.trim().length > 0),
    {
      message: "Informe ao menos uma opção (uma por linha).",
      path: ["optionsText"],
    }
  );

export type CreateCustomFieldFormValues = z.infer<typeof createCustomFieldSchema>;

export function parseOptionsText(text: string | undefined): string[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
