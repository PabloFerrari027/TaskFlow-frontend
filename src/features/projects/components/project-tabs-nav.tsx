"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProjectTabsNav({ projectId }: { projectId: string }) {
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
  ];

  const activeTab = tabs.find((tab) => pathname.startsWith(tab.href));

  return (
    <div className="space-y-2">
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
