"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ASSISTANT_SUGGESTIONS,
  useAssistantChat,
} from "@/features/assistant/context/assistant-chat-context";

// Entry point to the chat placed on pages (home, Assistente) so the
// assistant is in plain sight, not only behind the topbar button. It opens
// the same Sheet; a suggestion only pre-fills the composer, never sends.
export function AssistantPromptCard({ className }: { className?: string }) {
  const { openChat } = useAssistantChat();

  return (
    <section
      data-tour="assistant-prompt"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/25 bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:p-6",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Peça ao assistente de IA</h2>
          <p className="text-sm text-muted-foreground">
            Ele consulta, cria e organiza pastas e itens por você. Toda alteração pede sua
            confirmação antes.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => openChat()}
        className="mt-4 flex w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-sm text-muted-foreground shadow-xs transition-colors hover:border-primary/50"
      >
        <span className="flex-1 truncate">Pergunte ou peça algo...</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">
          Ctrl J
        </kbd>
        <ArrowRight className="size-4 text-primary" />
      </button>

      <div className="mt-3 flex flex-wrap gap-2">
        {ASSISTANT_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => openChat(suggestion)}
            className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
