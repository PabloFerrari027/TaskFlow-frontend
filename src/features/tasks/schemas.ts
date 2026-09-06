import { z } from "zod";

const NONE = "__none__";

export const taskFormSchema = z.object({
  title: z.string().min(1, "Informe um título."),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  sectionId: z.string().min(1, "Selecione uma coluna."),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export { NONE as UNASSIGNED_VALUE };
