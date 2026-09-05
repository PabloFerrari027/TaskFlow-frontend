"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { VerifyForm } from "@/features/auth/components/verify-form";
import { RequireGuest } from "@/features/auth/components/require-guest";

export function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeId = searchParams.get("challengeId");
  const email = searchParams.get("email");

  React.useEffect(() => {
    if (!challengeId) {
      router.replace("/login");
    }
  }, [challengeId, router]);

  if (!challengeId) return null;

  return (
    <RequireGuest>
      <AuthShell
        title="Verifique seu e-mail"
        description={
          email
            ? `Enviamos um código de 6 dígitos para ${email}.`
            : "Enviamos um código de 6 dígitos para o seu e-mail."
        }
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
        <VerifyForm challengeId={challengeId} />
      </AuthShell>
    </RequireGuest>
  );
}
