"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/shared/otp-input";
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
import { useVerifyTwoFactorMutation } from "@/features/auth/hooks/use-auth-mutations";
import { getErrorCode, getErrorMessage } from "@/lib/errors";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

export function VerifyForm({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyMutation = useVerifyTwoFactorMutation();

  const form = useForm<VerifyCodeFormValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: "" },
  });

  function onSubmit(values: VerifyCodeFormValues) {
    verifyMutation.mutate(
      { challengeId, code: values.code },
      {
        onSuccess: () => {
          toast.success("Login realizado com sucesso.");
          router.push(getSafeRedirectPath(searchParams.get("next")));
        },
        onError: (error) => {
          const code = getErrorCode(error);
          if (code === "CHALLENGE_MAX_ATTEMPTS_EXCEEDED" || code === "CHALLENGE_EXPIRED") {
            toast.error(getErrorMessage(error));
            router.push("/login");
            return;
          }
          form.setError("code", { message: getErrorMessage(error) });
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de verificação</FormLabel>
              <FormControl>
                <OtpInput
                  value={field.value}
                  onChange={field.onChange}
                  onComplete={() => form.handleSubmit(onSubmit)()}
                  disabled={verifyMutation.isPending}
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
          {verifyMutation.isPending ? <Loader2 className="animate-spin" /> : null}
          Verificar e entrar
        </Button>
      </form>
    </Form>
  );
}
