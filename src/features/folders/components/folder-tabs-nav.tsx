"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface FolderTab {
  href: string;
  label: string;
  /** One plain-language line on what the tab is for, shown under the tab bar. */
  hint: string;
  /** Other pages that count as this tab (Pessoas also covers Convites). */
  also?: string[];
  /** On a phone it moves into "Mais", so the bar fits without scrolling. */
  phoneInMore?: boolean;
}

const TAB_CLASS = "shrink-0 border-b-2 px-2 py-2.5 text-sm font-medium transition-colors sm:px-3";

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

  // What most people use, always visible; the rest under "Mais".
  const mainTabs: FolderTab[] = [
    {
      href: `${base}/items`,
      label: "Itens",
      hint: "Organize o trabalho em colunas. Clique em um item para ver os detalhes ou arraste para mudar de coluna.",
    },
    {
      href: `${base}/timeline`,
      label: "Cronograma",
      hint: "Os itens com datas numa linha do tempo, com as dependências entre eles. Clique numa barra para abrir o item.",
      phoneInMore: true,
    },
    {
      href: `${base}/recurring`,
      label: "Lembretes",
      hint: "O que volta sozinho em datas fixas, como “Pagar o aluguel” todo dia 5.",
    },
    {
      href: `${base}/members`,
      label: "Pessoas",
      hint: "Quem tem acesso a esta pasta. Para chamar alguém, use “Convidar pessoa”.",
      also: [`${base}/invitations`],
    },
  ];
  const moreTabs: FolderTab[] = [
    {
      href: `${base}/stats`,
      label: "Estatísticas",
      hint: "Veja em números como a pasta está andando: quanto já foi feito, o que está atrasado e quem está com mais itens.",
    },
    {
      href: `${base}/activity`,
      label: "Atividade",
      hint: "A linha do tempo de tudo que mudou nesta pasta: quem fez e quando.",
    },
    {
      href: `${base}/custom-fields`,
      label: "Campos extras",
      hint: "Crie campos próprios para guardar mais informações em cada item, como cliente ou valor.",
    },
    ...(showAutomations
      ? [
          {
            href: `${base}/automations`,
            label: "Automações",
            hint: "Deixe o TaskFlow fazer sozinho o que se repete nesta pasta, como mover itens concluídos de coluna.",
          },
        ]
      : []),
    {
      href: `${base}/trash`,
      label: "Lixeira",
      hint: "Itens apagados nos últimos 30 dias. Dá para trazê-los de volta.",
    },
    {
      href: `${base}/settings`,
      label: "Configurações",
      hint: "Ajuste como a pasta funciona: as etapas por onde os itens passam e outras regras.",
    },
  ];

  const isActive = (tab: FolderTab) =>
    [tab.href, ...(tab.also ?? [])].some((href) => pathname.startsWith(href));
  const activeTab = [...mainTabs, ...moreTabs].find(isActive);
  const activeMore = moreTabs.find(isActive);
  const phoneTabs = mainTabs.filter((tab) => tab.phoneInMore);
  const activePhoneTab = phoneTabs.find(isActive);

  return (
    <div className="space-y-2" data-tour="folder-tabs">
      <div className="flex gap-0.5 overflow-x-auto border-b border-border/60 [scrollbar-width:none] sm:gap-1">
        {mainTabs.map((tab) => {
          const active = tab === activeTab;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                TAB_CLASS,
                tab.phoneInMore && "hidden sm:block",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              TAB_CLASS,
              "inline-flex items-center gap-1 outline-none",
              activeMore
                ? "border-primary text-foreground"
                : activePhoneTab
                  ? "border-primary text-foreground sm:border-transparent sm:text-muted-foreground sm:hover:text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {activeMore ? (
              activeMore.label
            ) : activePhoneTab ? (
              <>
                <span className="sm:hidden">{activePhoneTab.label}</span>
                <span className="hidden sm:inline">Mais</span>
              </>
            ) : (
              "Mais"
            )}
            <ChevronDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {phoneTabs.map((tab) => (
              <DropdownMenuItem key={tab.href} asChild className="sm:hidden">
                <Link href={tab.href}>{tab.label}</Link>
              </DropdownMenuItem>
            ))}
            {moreTabs.map((tab) => (
              <MoreTabItem key={tab.href} tab={tab} active={tab === activeMore} />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {activeTab ? <p className="text-sm text-muted-foreground">{activeTab.hint}</p> : null}
    </div>
  );
}

function MoreTabItem({ tab, active }: { tab: FolderTab; active: boolean }) {
  return (
    <>
      {tab.label === "Lixeira" ? <DropdownMenuSeparator /> : null}
      <DropdownMenuItem asChild>
        <Link href={tab.href} aria-current={active ? "page" : undefined} className={cn(active && "font-medium")}>
          {tab.label}
        </Link>
      </DropdownMenuItem>
    </>
  );
}
