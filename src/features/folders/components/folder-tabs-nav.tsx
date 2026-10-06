"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function FolderTabsNav({
  folderId,
  showAutomations,
}: {
  folderId: string;
  // Hidden like the sidebar's "Automações": the API is OWNER/ADMIN only.
  showAutomations: boolean;
}) {
  const pathname = usePathname();
  const base = `/folders/${folderId}`;

  // `hint` is a one-line plain-language explanation of what the tab is for,
  // shown under the tab bar so first-time users never have to guess.
  const tabs = [
    {
      href: `${base}/items`,
      label: "Itens",
      hint: "Organize o trabalho em colunas. Clique em um item para ver os detalhes ou arraste para mudar de coluna.",
    },
    {
      href: `${base}/timeline`,
      label: "Cronograma",
      hint: "Os itens com datas numa linha do tempo, com as dependências entre eles. Clique numa barra para abrir o item.",
    },
    {
      href: `${base}/recurring`,
      label: "Repetições",
      hint: "Itens que o TaskFlow cria sozinho em datas fixas, como “Pagar o aluguel” todo dia 5.",
    },
    {
      href: `${base}/stats`,
      label: "Estatísticas",
      hint: "Veja em números como a pasta está andando: quanto já foi feito, o que está atrasado e quem está com mais itens.",
    },
    {
      href: `${base}/members`,
      label: "Pessoas",
      hint: "Quem tem acesso a esta pasta. Para adicionar alguém, use a aba Convites.",
    },
    {
      href: `${base}/invitations`,
      label: "Convites",
      hint: "Convide pessoas por e-mail e acompanhe quem já aceitou.",
    },
    {
      href: `${base}/custom-fields`,
      label: "Campos extras",
      hint: "Crie campos próprios para guardar mais informações em cada item, como cliente ou valor.",
    },
    {
      href: `${base}/activity`,
      label: "Atividade",
      hint: "A linha do tempo de tudo que mudou nesta pasta: quem fez e quando.",
    },
    {
      href: `${base}/trash`,
      label: "Lixeira",
      hint: "Itens apagados nos últimos 30 dias. Dá para trazê-las de volta.",
    },
    {
      href: `${base}/settings`,
      label: "Configurações",
      hint: "Ajuste como a pasta funciona: as etapas por onde os itens passam e outras regras.",
    },
    ...(showAutomations
      ? [
          {
            href: `${base}/automations`,
            label: "Automações",
            hint: "Deixe o TaskFlow fazer sozinho o que se repete nesta pasta, como mover itens concluídos de seção.",
          },
        ]
      : []),
  ];

  const activeTab = tabs.find((tab) => pathname.startsWith(tab.href));

  return (
    <div className="space-y-2" data-tour="folder-tabs">
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
