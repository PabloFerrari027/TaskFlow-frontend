import { z } from "zod";

export const commentFormSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Escreva algo antes de enviar.")
    .max(5000, "O comentário pode ter no máximo 5000 caracteres."),
});

export type CommentFormValues = z.infer<typeof commentFormSchema>;
