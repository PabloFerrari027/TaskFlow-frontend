import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2, "O nome precisa ter pelo menos 2 caracteres."),
  description: z.string().optional(),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(2, "O nome precisa ter pelo menos 2 caracteres.").optional(),
  description: z.string().optional(),
});

export type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>;

export const inviteProjectMemberSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  role: z.enum(["MEMBER", "GUEST"]),
});

export type InviteProjectMemberFormValues = z.infer<
  typeof inviteProjectMemberSchema
>;
