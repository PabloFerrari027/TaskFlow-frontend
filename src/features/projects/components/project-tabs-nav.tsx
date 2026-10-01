"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProjectTabsNav({
  projectId,
  showAutomations,
}: {
  projectId: string;
  // Hidden like the sidebar's "Automações": the API is OWNER/ADMIN only.
  showAutomations: boolean;
}) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  // `hint` is a one-line plain-language explanation of what the tab is for,
  // shown under the tab bar so first-time users never have to guess.
  const tabs = [
    {
      href: `${base}/tasks`,
      label: "Tarefas",
      hint: "Organize o trabalho em colunas. Clique em uma tarefa para ver os detalhes ou arraste para mudar de coluna.",
    },
    {
      href: `${base}/timeline`,
      label: "Cronograma",
      hint: "As tarefas com datas numa linha do tempo, com as dependências entre elas. Clique numa barra para abrir a tarefa.",
    },
    {
      href: `${base}/recurring`,
      label: "Repetições",
      hint: "Tarefas que o TaskFlow cria sozinho em datas fixas, como “Pagar o aluguel” todo dia 5.",
    },
    {
      href: `${base}/stats`,
      label: "Estatísticas",
      hint: "Veja em números como o projeto está andando: quanto já foi feito, o que está atrasado e quem está com mais tarefas.",
    },
    {
      href: `${base}/members`,
      label: "Pessoas",
      hint: "Quem tem acesso a este projeto. Para adicionar alguém, use a aba Convites.",
    },
    {
      href: `${base}/invitations`,
      label: "Convites",
      hint: "Convide pessoas por e-mail e acompanhe quem já aceitou.",
    },
    {
      href: `${base}/custom-fields`,
      label: "Campos extras",
      hint: "Crie campos próprios para guardar mais informações em cada tarefa, como cliente ou valor.",
    },
    {
      href: `${base}/activity`,
      label: "Atividade",
      hint: "A linha do tempo de tudo que mudou neste projeto: quem fez e quando.",
    },
    {
      href: `${base}/trash`,
      label: "Lixeira",
      hint: "Tarefas apagadas nos últimos 30 dias. Dá para trazê-las de volta.",
    },
    {
      href: `${base}/settings`,
      label: "Configurações",
      hint: "Ajuste como o projeto funciona: as etapas por onde as tarefas passam e outras regras.",
    },
    ...(showAutomations
      ? [
          {
            href: `${base}/automations`,
            label: "Automações",
            hint: "Deixe o TaskFlow fazer sozinho o que se repete neste projeto, como mover tarefas concluídas de seção.",
          },
        ]
      : []),
  ];

  const activeTab = tabs.find((tab) => pathname.startsWith(tab.href));

  return (
    <div className="space-y-2" data-tour="project-tabs">
      <div className="flex gap-1 overflow-x-auto border-b border-border/60">
        {tabs.map((tab) => {
          const active = tab === activeTab;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {activeTab ? <p className="text-sm text-muted-foreground">{activeTab.hint}</p> : null}
    </div>
  );
}
