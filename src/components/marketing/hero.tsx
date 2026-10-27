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
          Um assistente que guarda e lembra por você
        </div>

        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Guarde, lembre e organize a sua vida{" "}
          <span className="text-primary">conversando</span>
        </h1>

        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          Conte o que você precisa — uma conta para pagar, um remédio, uma
          consulta, as compras da casa — e o TaskFlow guarda no lugar certo e
          te lembra na hora. Por escrito ou por áudio, no app ou no WhatsApp.
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
          Grátis para começar. Sem cartão de crédito.
        </p>

        <ProductPreview />
      </div>
    </section>
  );
}
