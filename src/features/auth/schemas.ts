import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres."),
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
