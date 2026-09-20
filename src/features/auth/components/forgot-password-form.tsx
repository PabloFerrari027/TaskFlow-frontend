"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/schemas";
import { useForgotPasswordMutation } from "@/features/auth/hooks/use-auth-mutations";
import { getErrorMessage } from "@/lib/errors";

export function ForgotPasswordForm({ defaultEmail }: { defaultEmail?: string }) {
  const forgotMutation = useForgotPasswordMutation();
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const [expiresInMinutes, setExpiresInMinutes] = React.useState<number | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: defaultEmail ?? "" },
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    forgotMutation.mutate(values, {
      onSuccess: (data) => {
        setExpiresInMinutes(Math.round(data.expiresInSeconds / 60));
        setSentTo(values.email);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  // The API answers the same whether or not the account exists (so the form
  // can't be used to probe for registered e-mails) — the copy must not promise
  // that an e-mail was actually sent.
  if (sentTo) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-5" />
        </div>
        <p className="text-sm text-muted-foreground">
          Se existir uma conta com senha para{" "}
          <span className="font-medium text-foreground">{sentTo}</span>, enviamos um link
          para redefinir a senha
          {expiresInMinutes ? ` (válido por ${expiresInMinutes} minutos)` : ""}. Confira
          também a caixa de spam.
        </p>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setSentTo(null)}
        >
          Usar outro e-mail
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={forgotMutation.isPending}>
          {forgotMutation.isPending ? <Loader2 className="animate-spin" /> : null}
          Enviar link de redefinição
        </Button>
      </form>
    </Form>
  );
}
