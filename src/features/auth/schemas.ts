import { z } from "zod";

// Client-side password rule shared by register and the change/set-password
// forms, so the minimum length lives in one place.
export const newPasswordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.");

export const registerSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: newPasswordSchema,
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(6, "O código tem 6 dígitos.")
    .regex(/^\d{6}$/, "O código deve conter apenas números."),
});

export type VerifyCodeFormValues = z.infer<typeof verifyCodeSchema>;

const passwordsMatch = {
  check: (values: { newPassword: string; confirmPassword: string }) =>
    values.newPassword === values.confirmPassword,
  options: {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  },
};

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual."),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine(passwordsMatch.check, passwordsMatch.options);

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const setPasswordSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine(passwordsMatch.check, passwordsMatch.options);

export type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

export const linkGoogleSchema = z.object({
  currentPassword: z.string().min(1, "Informe sua senha atual."),
});

export type LinkGoogleFormValues = z.infer<typeof linkGoogleSchema>;
