import { Gauge, Eye, Lock, Puzzle } from "lucide-react";

const BENEFITS = [
  {
    icon: Eye,
    title: "Tudo à vista",
    description:
      "Você abre o app e já sabe o que vence hoje, o que atrasou e o que vem pela frente.",
  },
  {
    icon: Lock,
    title: "Só vê quem você chamar",
    description:
      "Suas pastas são suas até você decidir dividir, e dá para escolher quem pode editar.",
  },
  {
    icon: Puzzle,
    title: "Serve para tudo",
    description:
      "Casa, saúde, estudos, dinheiro ou trabalho: cada pasta se adapta ao assunto.",
  },
  {
    icon: Gauge,
    title: "Sem curva de aprendizado",
    description:
      "Se você sabe mandar uma mensagem, sabe usar o TaskFlow.",
  },
];

export function Benefits() {
  return (
    <section id="beneficios" className="border-t border-border/60 bg-muted/20 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Por que é mais leve
          </h2>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <benefit.icon className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
