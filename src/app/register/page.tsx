import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { RequireGuest } from "@/features/auth/components/require-guest";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <Suspense>
      <RequireGuest>
        <AuthShell
          title="Criar conta no TaskFlow"
          description="Leva menos de um minuto."
          footer={
            <>
              Já tem uma conta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </>
          }
        >
          <div className="space-y-5">
            <RegisterForm />
            <GoogleSignInButton />
          </div>
        </AuthShell>
      </RequireGuest>
    </Suspense>
  );
}
