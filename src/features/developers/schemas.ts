import { z } from "zod";
import { API_KEY_SCOPES } from "@/features/developers/lib/developer-catalog";
import { WEBHOOK_EVENTS } from "@/types/developer";

export const apiKeyFormSchema = z.object({
  name: z.string().min(1, "Dê um nome para a chave.").max(120, "Use no máximo 120 caracteres."),
  description: z.string().max(500, "Use no máximo 500 caracteres.").optional(),
  environment: z.enum(["LIVE", "TEST"]),
  scopes: z.array(z.enum(API_KEY_SCOPES)).min(1, "Escolha ao menos um escopo."),
});

export type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

export const webhookEndpointFormSchema = z.object({
  url: z.url("Informe uma URL válida.").refine((url) => url.startsWith("https://"), {
    message: "A URL precisa começar com https://.",
  }),
  description: z.string().max(500, "Use no máximo 500 caracteres.").optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1, "Escolha ao menos um evento."),
});

export type WebhookEndpointFormValues = z.infer<typeof webhookEndpointFormSchema>;
