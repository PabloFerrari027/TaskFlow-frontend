import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(2, "O nome precisa ter pelo menos 2 caracteres."),
  monthlyTokenBudget: z.coerce
    .number()
    .int("Use um número inteiro.")
    .min(1, "Informe um valor de pelo menos 1 token."),
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
});

export type EditPlanFormInput = z.input<typeof editPlanSchema>;
export type EditPlanFormValues = z.output<typeof editPlanSchema>;
