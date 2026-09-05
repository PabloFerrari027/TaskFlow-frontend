"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProjectTabsNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  const tabs = [
    { href: `${base}/tasks`, label: "Tarefas" },
    { href: `${base}/members`, label: "Membros" },
    { href: `${base}/invitations`, label: "Convites" },
    { href: `${base}/custom-fields`, label: "Campos personalizados" },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border/60">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
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
  );
}
