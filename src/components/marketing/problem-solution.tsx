import { CheckCircle2, XCircle } from "lucide-react";

const PROBLEMS = [
  "Tarefas espalhadas entre planilhas, chats e ferramentas soltas",
  "Ninguém sabe quem é responsável por quê, nem qual é o status real",
  "Convidar um colaborador externo vira um processo manual e inseguro",
  "Cada projeto precisaria de campos diferentes, mas a ferramenta não flexibiliza",
];

const SOLUTIONS = [
  "Workspaces organizam times, projetos e tarefas em uma hierarquia clara",
  "Responsáveis, status e subtarefas deixam o progresso visível para todos",
  "Convites por e-mail com papéis específicos para workspace e projeto",
  "Campos personalizados (texto, número, data, seleção, checkbox) por projeto",
];

export function ProblemSolution() {
  return (
    <section id="solucao" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Do caos operacional a um fluxo com dono
        </h2>
        <p className="mt-3 text-muted-foreground">
          O problema raramente é falta de esforço — é falta de estrutura. O
          TaskFlow dá essa estrutura sem burocracia.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Sem estrutura
          </h3>
          <ul className="mt-4 space-y-3">
            {PROBLEMS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
            Com TaskFlow
          </h3>
          <ul className="mt-4 space-y-3">
            {SOLUTIONS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
