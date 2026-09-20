"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AUTOMATION_TEMPLATES,
  type AutomationTemplate,
} from "@/features/automations/lib/automation-templates";
import { cn } from "@/lib/utils";

/**
 * Ready-made models so the tab never opens on a blank form: picking one
 * opens the builder already filled in, leaving only the workspace-specific
 * choices (which section, which project) to the user.
 */
export function AutomationTemplatesGallery({
  onPick,
  onCreateFromScratch,
  prominent,
}: {
  onPick: (template: AutomationTemplate) => void;
  onCreateFromScratch: () => void;
  // The empty-state version: this is the whole screen, so it says more.
  prominent?: boolean;
}) {
  return (
    <div className={cn("space-y-4", prominent && "py-4")}>
      {prominent ? (
        <div className="max-w-xl space-y-1">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" />
            Automatize o que se repete
          </h3>
          <p className="text-sm text-muted-foreground">
            Uma automação faz algo sozinha quando algo acontece — por exemplo, mover a tarefa de
            seção quando ela for concluída. Escolha um modelo pronto abaixo e ajuste do seu jeito.
          </p>
        </div>
      ) : (
        <h3 className="text-sm font-semibold text-foreground">Modelos prontos</h3>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {AUTOMATION_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onPick(template)}
            className="space-y-1 rounded-lg border border-border/60 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <p className="text-sm font-medium text-foreground">{template.title}</p>
            <p className="text-xs text-muted-foreground">{template.description}</p>
            <p className="pt-1 text-xs font-medium text-primary">Usar este modelo →</p>
          </button>
        ))}
      </div>

      <div>
        <Button variant="outline" size="sm" onClick={onCreateFromScratch}>
          Prefiro montar a minha do zero
        </Button>
      </div>
    </div>
  );
}
