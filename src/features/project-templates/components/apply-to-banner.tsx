"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectQuery } from "@/features/projects/hooks/use-projects";

/** Shown while picking a template for "Aplicar um modelo" in a project. */
export function ApplyToBanner() {
  const applyTo = useSearchParams().get("applyTo");
  const projectQuery = useProjectQuery(applyTo ?? "");

  if (!applyTo) return null;
  const name = projectQuery.data?.name;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
      <Wand2 className="size-4 shrink-0 text-primary" />
      <p className="flex-1 text-foreground">
        Escolha um modelo para aplicar em <strong>{name ?? "seu projeto"}</strong>. As colunas, os
        campos e as tarefas dele entram depois do que o projeto já tem.
      </p>
      <Button asChild variant="ghost" size="sm">
        <Link href="/templates">
          <X /> Cancelar
        </Link>
      </Button>
    </div>
  );
}
