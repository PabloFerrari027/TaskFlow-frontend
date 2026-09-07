"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";
import { RequireGuest } from "@/features/auth/components/require-guest";

export function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  React.useEffect(() => {
    if (!email) {
      router.replace("/register");
    }
  }, [email, router]);

  if (!email) return null;

  return (
    <RequireGuest>
      <AuthShell
        title="Confirme seu e-mail"
        description={`Enviamos um código de 6 dígitos para ${email}.`}
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
        <VerifyEmailForm email={email} />
      </AuthShell>
    </RequireGuest>
  );
}
