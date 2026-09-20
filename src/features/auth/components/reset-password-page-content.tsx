"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/features/auth/components/auth-shell";
import {
  INVALID_LINK_MESSAGE,
  InvalidLinkNotice,
  ResetPasswordForm,
} from "@/features/auth/components/reset-password-form";

// Deliberately NOT wrapped in RequireGuest: the e-mailed link must work even if
// this browser still has a session (the reset revokes it anyway).
export function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <AuthShell
      title="Criar nova senha"
      description={token ? "Escolha uma nova senha para a sua conta." : undefined}
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
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <InvalidLinkNotice message={INVALID_LINK_MESSAGE} />
      )}
    </AuthShell>
  );
}
