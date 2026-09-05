import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { RequireGuest } from "@/features/auth/components/require-guest";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <Suspense>
      <RequireGuest>
        <AuthShell
          title="Entrar no TaskFlow"
          description="Informe suas credenciais para continuar."
          footer={
            <>
              Ainda não tem conta?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Criar conta
              </Link>
            </>
          }
        >
          <div className="space-y-5">
            <LoginForm />
            <GoogleSignInButton />
          </div>
        </AuthShell>
      </RequireGuest>
    </Suspense>
  );
}
