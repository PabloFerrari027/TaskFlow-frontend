"use client";

import { ShieldCheck } from "lucide-react";
import type { AutomationLookups } from "@/features/automations/hooks/use-automation-lookups";
import {
  describeDraft,
  type RuleDraft,
  type SentenceSegment,
} from "@/features/automations/lib/automation-draft";
import { cn } from "@/lib/utils";

export function SentenceText({ segments }: { segments: SentenceSegment[] }) {
  return (
    <>
      {segments.map((segment, index) => (
        <span
          key={index}
          className={cn(
            segment.tone === "value" && "font-semibold text-foreground",
            segment.tone === "missing" && "text-amber-600 dark:text-amber-400"
          )}
        >
          {segment.text}
        </span>
      ))}
    </>
  );
}

/**
 * The whole rule as plain text, always visible while editing — the same
 * transparency principle as the assistant's PendingActionCard: what will
 * actually happen is never hidden behind a technical field name.
 */
export function AutomationLivePreview({
  draft,
  lookups,
}: {
  draft: RuleDraft;
  lookups: AutomationLookups;
}) {
  return (
    <div
      className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3"
      aria-live="polite"
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        O que esta regra faz
      </p>
      <p className="text-base leading-relaxed text-foreground/90">
        <SentenceText segments={describeDraft(draft, lookups)} />
      </p>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        Roda sozinha, sem pedir confirmação, com a permissão de quem criou a regra.
      </p>
    </div>
  );
}
