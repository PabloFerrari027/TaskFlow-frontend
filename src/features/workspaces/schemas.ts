import { z } from "zod";

export const workspaceNameSchema = z.object({
  name: z.string().min(2, "O nome precisa ter pelo menos 2 caracteres."),
});

export type WorkspaceNameFormValues = z.infer<typeof workspaceNameSchema>;

export const inviteWorkspaceMemberSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  role: z.enum(["ADMIN", "MEMBER", "GUEST"]),
});

export type InviteWorkspaceMemberFormValues = z.infer<
  typeof inviteWorkspaceMemberSchema
>;
