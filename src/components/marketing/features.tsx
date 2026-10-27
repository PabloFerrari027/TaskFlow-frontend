import {
  Building2,
  ListChecks,
  Paperclip,
  SlidersHorizontal,
  UserPlus,
  ShieldCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: Building2,
    title: "Pastas prontas para começar",
    description:
      "Modelos para gastos do mês, remédios e consultas, estudos, vendas e muito mais. Ou o assistente monta com você.",
  },
  {
    icon: ListChecks,
    title: "Itens e lembretes",
    description:
      "Cada coisa a fazer com prazo, hora e aviso. Marque como feita e veja o que ainda falta.",
  },
  {
    icon: Paperclip,
    title: "Fotos e documentos junto",
    description:
      "Guarde a receita, o boleto ou o comprovante no item certo, para achar quando precisar.",
  },
  {
    icon: SlidersHorizontal,
    title: "Do seu jeito",
    description:
      "Colunas e campos extras para o que for seu: valor, cliente, dose, matéria.",
  },
  {
    icon: UserPlus,
    title: "Divida com quem quiser",
    description:
      "Chame a família ou a equipe para uma pasta e decida quem só vê e quem pode editar.",
  },
  {
    icon: ShieldCheck,
    title: "Seus dados protegidos",
    description:
      "Entrada com código por e-mail ou com Google. O assistente mostra o que vai fazer, e você confere.",
  },
];

export function Features() {
  return (
    <section id="funcionalidades" className="border-t border-border/60 bg-muted/20 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            O que dá para fazer
          </h2>
          <p className="mt-3 text-muted-foreground">
            Para a casa, a saúde, os estudos, o dinheiro ou o seu pequeno
            negócio.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border/60 bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
