import Link from "next/link";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = { title: "Acesso negado" };

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 px-4 text-center">
      <Logo />
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-7" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Acesso negado</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Você não tem permissão para acessar este recurso. Se acha que isso é
          um engano, peça a um administrador do workspace para verificar seu
          papel de acesso.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/">Ir para a home</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">Ir para o dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
