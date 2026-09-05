import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 text-center sm:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"
        />
        <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
          Pronto para organizar o trabalho da sua equipe?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
          Crie sua conta gratuitamente e monte seu primeiro workspace em
          minutos.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">
              Criar conta grátis
              <ArrowRight />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            asChild
          >
            <Link href="/login">Já tenho conta</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
