import { z } from "zod";
import { isValidPriceInput } from "@/features/plans/lib/price";

// Typed in reais ("49,90"); converted to cents (parsePriceInput) on submit.
const monthlyPrice = z
  .string()
  .refine(isValidPriceInput, "Use um valor em reais, como 49,90 (0 = gratuito).");

export const createPlanSchema = z.object({
  name: z.string().min(2, "O nome precisa ter pelo menos 2 caracteres."),
  monthlyTokenBudget: z.coerce
    .number()
    .int("Use um número inteiro.")
    .min(1, "Informe um valor de pelo menos 1 token."),
  monthlyPrice,
});

// `monthlyTokenBudget` comes off the <Input> as a string — `z.coerce.number()`
// means the form's raw input type and its resolved (submitted) type differ.
export type CreatePlanFormInput = z.input<typeof createPlanSchema>;
export type CreatePlanFormValues = z.output<typeof createPlanSchema>;

export const editPlanSchema = z.object({
  monthlyTokenBudget: z.coerce
    .number()
    .int("Use um número inteiro.")
    .min(1, "Informe um valor de pelo menos 1 token."),
  monthlyPrice,
});

export type EditPlanFormInput = z.input<typeof editPlanSchema>;
export type EditPlanFormValues = z.output<typeof editPlanSchema>;
