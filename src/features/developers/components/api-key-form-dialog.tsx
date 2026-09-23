"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  API_KEY_ENVIRONMENT_LABEL,
  API_KEY_SCOPES,
  API_KEY_SCOPE_LABEL,
} from "@/features/developers/lib/developer-catalog";
import { apiKeyFormSchema, type ApiKeyFormValues } from "@/features/developers/schemas";
import {
  useCreateApiKeyMutation,
  useUpdateApiKeyMutation,
} from "@/features/developers/hooks/use-api-keys";
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import type { ApiKeyDto } from "@/types/developer";

interface ApiKeyFormDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Editing an existing key; otherwise creating one.
  apiKey?: ApiKeyDto | null;
  // Fired only on create, with the response that carries the one-time
  // `plainKey` — the caller shows it in a RevealSecretDialog.
  onCreated?: (key: ApiKeyDto) => void;
}

export function ApiKeyFormDialog({
  workspaceId,
  open,
  onOpenChange,
  apiKey,
  onCreated,
}: ApiKeyFormDialogProps) {
  const createMutation = useCreateApiKeyMutation(workspaceId);
  const updateMutation = useUpdateApiKeyMutation(workspaceId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      name: apiKey?.name ?? "",
      description: apiKey?.description ?? "",
      environment: apiKey?.environment ?? "LIVE",
      scopes: apiKey?.scopes ?? [],
    },
  });

  const [expiresAt, setExpiresAt] = React.useState(() => toDateInputValue(apiKey?.expiresAt));

  function handleClose(next: boolean) {
    if (!next) {
      form.reset();
      setExpiresAt("");
    }
    onOpenChange(next);
  }

  function onSubmit(values: ApiKeyFormValues) {
    const description = values.description?.trim() || undefined;
    const expiresAtIso = expiresAt ? fromDateInputValue(expiresAt) : undefined;

    if (apiKey) {
      updateMutation.mutate(
        {
          apiKeyId: apiKey.id,
          payload: {
            name: values.name,
            description,
            scopes: values.scopes,
            expiresAt: expiresAtIso,
          },
        },
        { onSuccess: () => handleClose(false) }
      );
      return;
    }

    createMutation.mutate(
      {
        name: values.name,
        description,
        environment: values.environment,
        scopes: values.scopes,
        expiresAt: expiresAtIso,
      },
      {
        onSuccess: (key) => {
          handleClose(false);
          onCreated?.(key);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{apiKey ? "Editar chave de API" : "Nova chave de API"}</DialogTitle>
          <DialogDescription>
            {apiKey
              ? "Escopos e validade podem ser alterados a qualquer momento; o segredo continua o mesmo."
              : "O segredo completo só aparece uma vez, logo após a criação."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="CI pipeline" autoFocus {...field} />
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
                      placeholder="Usada pelo workflow noturno de release"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!apiKey ? (
              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ambiente</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(API_KEY_ENVIRONMENT_LABEL) as (keyof typeof API_KEY_ENVIRONMENT_LABEL)[]).map(
                          (env) => (
                            <SelectItem key={env} value={env}>
                              {API_KEY_ENVIRONMENT_LABEL[env]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="scopes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escopos</FormLabel>
                  <div className="space-y-2 rounded-lg border border-border p-3">
                    {API_KEY_SCOPES.map((scope) => {
                      const checked = field.value.includes(scope);
                      return (
                        <label
                          key={scope}
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) =>
                              field.onChange(
                                next
                                  ? [...field.value, scope]
                                  : field.value.filter((s) => s !== scope)
                              )
                            }
                          />
                          <span>{API_KEY_SCOPE_LABEL[scope]}</span>
                          <span className="text-xs text-muted-foreground">({scope})</span>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="api-key-expires-at">Expira em (opcional)</Label>
              <Input
                id="api-key-expires-at"
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : null}
                {apiKey ? "Salvar alterações" : "Criar chave"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
