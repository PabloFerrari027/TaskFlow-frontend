"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
  verifyCodeSchema,
  type VerifyCodeFormValues,
} from "@/features/auth/schemas";
import {
  useResendVerificationCodeMutation,
  useVerifyEmailMutation,
} from "@/features/auth/hooks/use-auth-mutations";
import { getErrorCode, getErrorMessage } from "@/lib/errors";

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useResendVerificationCodeMutation();
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const form = useForm<VerifyCodeFormValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: "" },
  });

  function goToLogin(message: string) {
    toast.success(message);
    router.push(`/login?email=${encodeURIComponent(email)}`);
  }

  function onSubmit(values: VerifyCodeFormValues) {
    verifyMutation.mutate(
      { email, code: values.code },
      {
        onSuccess: () => goToLogin("E-mail confirmado! Faça login para continuar."),
        onError: (error) => {
          const code = getErrorCode(error);
          if (code === "EMAIL_ALREADY_VERIFIED") {
            goToLogin("Este e-mail já foi confirmado. Faça login para continuar.");
            return;
          }
          form.setError("code", { message: getErrorMessage(error) });
        },
      }
    );
  }

  function onResend() {
    resendMutation.mutate(
      { email },
      {
        onSuccess: () => {
          toast.success("Enviamos um novo código para o seu e-mail.");
          // No cooldown is returned by the API — this just throttles the
          // button client-side against the per-e-mail rate limit (3/10min).
          setCooldown(30);
          form.reset({ code: "" });
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    );
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de verificação</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    className="text-center text-lg tracking-[0.5em]"
                    {...field}
                    onChange={(event) =>
                      field.onChange(event.target.value.replace(/\D/g, ""))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? <Loader2 className="animate-spin" /> : null}
            Confirmar e-mail
          </Button>
        </form>
      </Form>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={resendMutation.isPending || cooldown > 0}
        onClick={onResend}
      >
        {resendMutation.isPending ? <Loader2 className="animate-spin" /> : null}
        {cooldown > 0 ? `Reenviar código (${cooldown}s)` : "Reenviar código"}
      </Button>
    </div>
  );
}
