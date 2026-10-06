import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(2, "O nome precisa ter pelo menos 2 caracteres."),
  description: z.string().optional(),
});

export type CreateFolderFormValues = z.infer<typeof createFolderSchema>;

export const updateFolderSchema = z.object({
  name: z.string().min(2, "O nome precisa ter pelo menos 2 caracteres.").optional(),
  description: z.string().optional(),
});

export type UpdateFolderFormValues = z.infer<typeof updateFolderSchema>;

export const inviteFolderMemberSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  role: z.enum(["MEMBER", "GUEST"]),
});

export type InviteFolderMemberFormValues = z.infer<
  typeof inviteFolderMemberSchema
>;
