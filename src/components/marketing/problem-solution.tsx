import { CheckCircle2, XCircle } from "lucide-react";

const PROBLEMS = [
  "Contas, consultas e recados espalhados no papel, nas conversas e na memória",
  "Lembrar do remédio, do vencimento e do aniversário na hora certa",
  "Planilhas e aplicativos complicados que ninguém aguenta usar",
  "Combinar as tarefas da casa com a família vira cobrança",
];

const SOLUTIONS = [
  "Você fala do seu jeito e o assistente guarda no lugar certo",
  "Lembretes na hora combinada: uma vez, ou todo dia, semana ou mês",
  "Telas simples, com o essencial à vista",
  "Pastas divididas com quem você quiser, cada um sabendo o que é seu",
];

export function ProblemSolution() {
  return (
    <section id="solucao" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Da cabeça cheia para a vida em ordem
        </h2>
        <p className="mt-3 text-muted-foreground">
          Não é falta de esforço: é coisa demais para lembrar. O TaskFlow
          lembra por você.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Hoje
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
