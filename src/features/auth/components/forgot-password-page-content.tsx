"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { RequireGuest } from "@/features/auth/components/require-guest";

export function ForgotPasswordPageContent() {
  const searchParams = useSearchParams();

  return (
    <RequireGuest>
      <AuthShell
        title="Esqueceu a senha?"
        description="Informe seu e-mail e enviaremos um link para criar uma nova."
        footer={
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Voltar ao login
          </Link>
        }
      >
        <ForgotPasswordForm defaultEmail={searchParams.get("email") ?? undefined} />
      </AuthShell>
    </RequireGuest>
  );
}
