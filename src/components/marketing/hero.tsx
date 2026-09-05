import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPreview } from "@/components/marketing/product-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center blur-3xl"
      >
        <div className="aspect-[1155/678] w-[72rem] bg-gradient-to-tr from-primary/30 via-primary/10 to-transparent opacity-40" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Workspaces, projetos e tarefas em um só lugar
        </div>

        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Organize o trabalho da sua equipe com{" "}
          <span className="text-primary">clareza de ponta a ponta</span>
        </h1>

        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          TaskFlow reúne workspaces, projetos, tarefas, subtarefas e anexos em
          um fluxo simples — com convites por e-mail, papéis de acesso e
          campos personalizados para adaptar cada projeto ao seu jeito de
          trabalhar.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/register">
              Criar conta grátis
              <ArrowRight />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Sem cartão de crédito. Configure seu primeiro workspace em minutos.
        </p>

        <ProductPreview />
      </div>
    </section>
  );
}
