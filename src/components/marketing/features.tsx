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
    title: "Workspaces e projetos",
    description:
      "Organize equipes em workspaces, cada um com múltiplos projetos ativos ou arquivados.",
  },
  {
    icon: ListChecks,
    title: "Tarefas e subtarefas",
    description:
      "Quebre o trabalho em tarefas com status (a fazer, em progresso, concluída) e subtarefas.",
  },
  {
    icon: Paperclip,
    title: "Anexos por tarefa",
    description:
      "Anexe arquivos de até 20MB diretamente na tarefa relevante, sem perder contexto.",
  },
  {
    icon: SlidersHorizontal,
    title: "Campos personalizados",
    description:
      "Crie campos de texto, número, data, seleção única/múltipla, checkbox ou pessoas por projeto.",
  },
  {
    icon: UserPlus,
    title: "Convites com papéis",
    description:
      "Convide por e-mail para o workspace ou para um projeto específico, com o papel certo para cada pessoa.",
  },
  {
    icon: ShieldCheck,
    title: "Autenticação segura",
    description:
      "Login com 2FA por e-mail ou Google, sessões visíveis e revogáveis a qualquer momento.",
  },
];

export function Features() {
  return (
    <section id="funcionalidades" className="border-t border-border/60 bg-muted/20 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Tudo que um time precisa para executar
          </h2>
          <p className="mt-3 text-muted-foreground">
            Sem inchaço de funcionalidades que ninguém usa — só o essencial,
            bem feito.
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
