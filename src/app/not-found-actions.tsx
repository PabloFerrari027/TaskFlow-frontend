"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

// Signed in, "home" means Início — the public landing would ask them to sign
// in again. Signed out, the folders button would only bounce to the login.
export function NotFoundActions() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Button asChild>
        <Link href="/">Ir para a página inicial</Link>
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" asChild>
        <Link href="/folders">Ver minhas pastas</Link>
      </Button>
      <Button asChild>
        <Link href="/home">Voltar ao Início</Link>
      </Button>
    </div>
  );
}
