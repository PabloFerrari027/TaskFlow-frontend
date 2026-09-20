"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas";
import { useResetPasswordMutation } from "@/features/auth/hooks/use-auth-mutations";
import { getErrorCode, getErrorMessage } from "@/lib/errors";

export const INVALID_LINK_MESSAGE =
  "Este link de redefinição é inválido, expirou ou já foi usado.";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const resetMutation = useResetPasswordMutation();
  const [tokenRejected, setTokenRejected] = React.useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  function onSubmit(values: ResetPasswordFormValues) {
    resetMutation.mutate(
      { token, newPassword: values.newPassword },
      {
        onSuccess: () => {
          toast.success("Senha redefinida! Entre com a nova senha.");
          router.push("/login");
        },
        onError: (error) => {
          if (getErrorCode(error) === "INVALID_PASSWORD_RESET_TOKEN") {
            setTokenRejected(true);
            return;
          }
          toast.error(getErrorMessage(error));
        },
      }
    );
  }

  if (tokenRejected) {
    return <InvalidLinkNotice message={INVALID_LINK_MESSAGE} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar nova senha</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
          {resetMutation.isPending ? <Loader2 className="animate-spin" /> : null}
          Redefinir senha
        </Button>
      </form>
    </Form>
  );
}

export function InvalidLinkNotice({ message }: { message: string }) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild className="w-full">
        <Link href="/forgot-password">Pedir novo link</Link>
      </Button>
    </div>
  );
}
