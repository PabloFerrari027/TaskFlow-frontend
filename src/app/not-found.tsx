import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 px-4 text-center">
      <Logo />
      <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileQuestion className="size-7" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground">
          O endereço que você acessou não existe ou foi movido.
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
