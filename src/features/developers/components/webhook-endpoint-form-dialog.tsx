"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  WEBHOOK_EVENT_GROUPS,
  WEBHOOK_EVENT_LABEL,
} from "@/features/developers/lib/developer-catalog";
import {
  webhookEndpointFormSchema,
  type WebhookEndpointFormValues,
} from "@/features/developers/schemas";
import {
  useCreateWebhookEndpointMutation,
  useUpdateWebhookEndpointMutation,
} from "@/features/developers/hooks/use-webhook-endpoints";
import type { WebhookEndpointDto } from "@/types/developer";

interface WebhookEndpointFormDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Editing an existing endpoint; otherwise creating one.
  webhookEndpoint?: WebhookEndpointDto | null;
  // Fired only on create, with the response that carries the one-time
  // `plainSigningSecret` — the caller shows it in a RevealSecretDialog.
  onCreated?: (endpoint: WebhookEndpointDto) => void;
}

export function WebhookEndpointFormDialog({
  workspaceId,
  open,
  onOpenChange,
  webhookEndpoint,
  onCreated,
}: WebhookEndpointFormDialogProps) {
  const createMutation = useCreateWebhookEndpointMutation(workspaceId);
  const updateMutation = useUpdateWebhookEndpointMutation(workspaceId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<WebhookEndpointFormValues>({
    resolver: zodResolver(webhookEndpointFormSchema),
    defaultValues: {
      url: webhookEndpoint?.url ?? "",
      description: webhookEndpoint?.description ?? "",
      events: (webhookEndpoint?.events ?? []) as WebhookEndpointFormValues["events"],
    },
  });

  function handleClose(next: boolean) {
    if (!next) form.reset();
    onOpenChange(next);
  }

  function onSubmit(values: WebhookEndpointFormValues) {
    const description = values.description?.trim() || undefined;

    if (webhookEndpoint) {
      updateMutation.mutate(
        {
          webhookEndpointId: webhookEndpoint.id,
          payload: { url: values.url, description, events: values.events },
        },
        { onSuccess: () => handleClose(false) }
      );
      return;
    }

    createMutation.mutate(
      { url: values.url, description, events: values.events },
      {
        onSuccess: (endpoint) => {
          handleClose(false);
          onCreated?.(endpoint);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{webhookEndpoint ? "Editar webhook" : "Novo webhook"}</DialogTitle>
          <DialogDescription>
            {webhookEndpoint
              ? "A URL precisa ser https:// e não pode apontar para um endereço privado ou local."
              : "O segredo de assinatura só aparece uma vez, logo após a criação."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/webhooks/taskflow"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Envia eventos de tarefas para o nosso relay do Slack"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="events"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eventos</FormLabel>
                  <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
                    {WEBHOOK_EVENT_GROUPS.map((group) => (
                      <div key={group.label} className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {group.label}
                        </p>
                        {group.events.map((event) => {
                          const checked = field.value.includes(event);
                          return (
                            <label
                              key={event}
                              className="flex items-center gap-2 text-sm text-foreground"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(next) =>
                                  field.onChange(
                                    next
                                      ? [...field.value, event]
                                      : field.value.filter((e) => e !== event)
                                  )
                                }
                              />
                              <span>{WEBHOOK_EVENT_LABEL[event]}</span>
                            </label>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : null}
                {webhookEndpoint ? "Salvar alterações" : "Criar webhook"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
