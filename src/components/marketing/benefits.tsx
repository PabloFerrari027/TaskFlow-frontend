import { Gauge, Eye, Lock, Puzzle } from "lucide-react";

const BENEFITS = [
  {
    icon: Eye,
    title: "Visibilidade real",
    description:
      "Todo mundo enxerga o mesmo status, os mesmos responsáveis e o mesmo histórico — sem retrabalho de alinhamento.",
  },
  {
    icon: Lock,
    title: "Acesso sob controle",
    description:
      "Papéis por workspace e por projeto garantem que cada pessoa veja e edite exatamente o que deveria.",
  },
  {
    icon: Puzzle,
    title: "Flexível o suficiente",
    description:
      "Campos personalizados adaptam cada projeto à sua realidade, sem exigir uma ferramenta nova para cada caso.",
  },
  {
    icon: Gauge,
    title: "Rápido de adotar",
    description:
      "Interface direta, sem curva de aprendizado — sua equipe começa a usar no primeiro dia.",
  },
];

export function Benefits() {
  return (
    <section id="beneficios" className="border-t border-border/60 bg-muted/20 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Por que times escolhem o TaskFlow
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
