"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Info, Lightbulb, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getGuide,
  type GuideCallout,
  type TutorialGuide,
} from "@/features/tutorial/lib/tutorial-guides";

const CALLOUT_STYLE = {
  tip: {
    icon: Lightbulb,
    label: "Dica",
    className: "border-primary/30 bg-primary/5",
    iconClassName: "text-primary",
  },
  note: {
    icon: Info,
    label: "Bom saber",
    className: "border-border bg-muted/50",
    iconClassName: "text-muted-foreground",
  },
  warning: {
    icon: AlertTriangle,
    label: "Atenção",
    className: "border-amber-500/30 bg-amber-500/10",
    iconClassName: "text-amber-600 dark:text-amber-400",
  },
} as const;

function Callout({ kind, text }: GuideCallout) {
  const style = CALLOUT_STYLE[kind];
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-lg border p-3 text-sm text-foreground",
        style.className
      )}
    >
      <style.icon className={cn("mt-0.5 size-4 shrink-0", style.iconClassName)} />
      <p>
        <span className="font-medium">{style.label}: </span>
        {text}
      </p>
    </div>
  );
}

export function GuideBody({
  guide,
  onOpenGuide,
}: {
  guide: TutorialGuide;
  onOpenGuide: (id: string) => void;
}) {
  const router = useRouter();
  const related = (guide.related ?? [])
    .map(getGuide)
    .filter((related): related is TutorialGuide => Boolean(related));

  return (
    <div className="space-y-6">
      {guide.audience ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" /> {guide.audience}
        </p>
      ) : null}

      {guide.sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{section.heading}</h3>
          {section.intro ? (
            <p className="text-muted-foreground">{section.intro}</p>
          ) : null}
          {section.steps ? (
            <ol className="list-decimal space-y-2 pl-5 marker:font-medium marker:text-muted-foreground">
              {section.steps.map((step) => (
                <li key={step} className="pl-1">
                  {step}
                </li>
              ))}
            </ol>
          ) : null}
          {section.bullets ? (
            <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground/60">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="pl-1">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
          {section.callouts?.map((callout) => (
            <Callout key={callout.text} {...callout} />
          ))}
        </section>
      ))}

      {guide.faq ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Dúvidas e problemas comuns</h3>
          <div className="divide-y divide-border/60 rounded-lg border border-border/60">
            {guide.faq.map((item) => (
              <details key={item.question} className="group px-3 py-2.5">
                <summary className="cursor-pointer list-none text-sm font-medium text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="mr-1.5 inline-block text-muted-foreground transition-transform group-open:rotate-90">
                    ›
                  </span>
                  {item.question}
                </summary>
                <p className="mt-2 pl-4 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 || guide.href ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          {guide.href ? (
            <Button size="sm" onClick={() => router.push(guide.href!)}>
              {guide.hrefLabel ?? "Abrir"} <ArrowRight />
            </Button>
          ) : null}
          {related.length > 0 ? (
            <span className="text-xs text-muted-foreground">Leia também:</span>
          ) : null}
          {related.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant="outline"
              onClick={() => onOpenGuide(item.id)}
            >
              {item.title}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
