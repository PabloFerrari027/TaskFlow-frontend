"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { useLoginMutation } from "@/features/auth/hooks/use-auth-mutations";
import { getErrorCode, getErrorMessage } from "@/lib/errors";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: searchParams.get("email") ?? "",
      password: "",
    },
  });

  // Carry over whatever the user already typed so they don't retype it.
  const typedEmail = useWatch({ control: form.control, name: "email" });
  const forgotPasswordHref = typedEmail
    ? `/forgot-password?email=${encodeURIComponent(typedEmail)}`
    : "/forgot-password";

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        const params = new URLSearchParams({
          challengeId: data.challengeId,
          email: values.email,
          expiresIn: String(data.expiresInSeconds),
        });
        const next = searchParams.get("next");
        if (next) params.set("next", next);
        router.push(`/login/verify?${params.toString()}`);
      },
      onError: (error) => {
        if (getErrorCode(error) === "EMAIL_NOT_VERIFIED") {
          toast.error("Confirme seu e-mail antes de entrar.");
          router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
          return;
        }
        toast.error(getErrorMessage(error));
      },
    });
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Senha</FormLabel>
                <Link
                  href={forgotPasswordHref}
                  className="text-xs font-medium text-primary hover:underline"
                  tabIndex={-1}
                >
                  Esqueci minha senha
                </Link>
              </div>
              <FormControl>
                <PasswordInput
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? <Loader2 className="animate-spin" /> : null}
          Entrar
        </Button>
      </form>
    </Form>
  );
}
