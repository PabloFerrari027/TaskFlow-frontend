"use client";

import * as React from "react";
import { SearchX, Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { GuideBody } from "@/features/tutorial/components/guide-body";
import {
  GUIDE_GROUP_LABEL,
  GUIDE_GROUP_ORDER,
  TUTORIAL_GUIDES,
  type TutorialGuide,
} from "@/features/tutorial/lib/tutorial-guides";

// A search hit list this short is worth opening right away.
const AUTO_OPEN_LIMIT = 3;

// "Ação" and "acao" should find each other.
function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function guideSearchText(guide: TutorialGuide) {
  return normalize(
    [
      guide.title,
      guide.summary,
      guide.audience ?? "",
      ...guide.sections.flatMap((section) => [
        section.heading,
        section.intro ?? "",
        ...(section.steps ?? []),
        ...(section.bullets ?? []),
        ...(section.callouts ?? []).map((callout) => callout.text),
      ]),
      ...(guide.faq ?? []).flatMap((item) => [item.question, item.answer]),
    ].join("\n")
  );
}

const SEARCH_INDEX = new Map(
  TUTORIAL_GUIDES.map((guide) => [guide.id, guideSearchText(guide)])
);

const anchorId = (guideId: string) => `guide-${guideId}`;

export function TutorialGuides() {
  const [query, setQuery] = React.useState("");
  const [openIds, setOpenIds] = React.useState<string[]>([TUTORIAL_GUIDES[0].id]);

  const normalizedQuery = normalize(query.trim());
  const visibleGuides = normalizedQuery
    ? TUTORIAL_GUIDES.filter((guide) =>
        SEARCH_INDEX.get(guide.id)?.includes(normalizedQuery)
      )
    : TUTORIAL_GUIDES;

  // Opens a guide (clearing any search that would hide it) and scrolls to it.
  // Also what a `/tutorial#<id>` link does on arrival.
  const goToGuide = React.useCallback((id: string) => {
    setQuery("");
    setOpenIds((current) => (current.includes(id) ? current : [...current, id]));
    window.history.replaceState(null, "", `#${id}`);
    requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      document
        .getElementById(anchorId(id))
        ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }, []);

  React.useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.slice(1);
      if (TUTORIAL_GUIDES.some((guide) => guide.id === id)) goToGuide(id);
    };
    const frame = requestAnimationFrame(openFromHash);
    window.addEventListener("hashchange", openFromHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, [goToGuide]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    const next = normalize(value.trim());
    if (!next) return;
    const hits = TUTORIAL_GUIDES.filter((guide) =>
      SEARCH_INDEX.get(guide.id)?.includes(next)
    );
    if (hits.length <= AUTO_OPEN_LIMIT) setOpenIds(hits.map((guide) => guide.id));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Buscar nos guias (ex.: prazo, convite, offline)"
            aria-label="Buscar nos guias"
            className="h-10 pl-9"
          />
        </div>

        {!normalizedQuery ? (
          <nav aria-label="Guias" className="flex flex-wrap gap-1.5">
            {TUTORIAL_GUIDES.map((guide) => (
              <Button
                key={guide.id}
                variant="secondary"
                size="sm"
                onClick={() => goToGuide(guide.id)}
              >
                <guide.icon /> {guide.title}
              </Button>
            ))}
          </nav>
        ) : (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {visibleGuides.length === 0
              ? "Nenhum guia encontrado."
              : `${visibleGuides.length} ${visibleGuides.length === 1 ? "guia encontrado" : "guias encontrados"}.`}
          </p>
        )}
      </div>

      {visibleGuides.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="Nada encontrado"
          description="Tente outra palavra, ou limpe a busca para ver todos os guias."
        />
      ) : (
        <Accordion
          type="multiple"
          value={openIds}
          onValueChange={setOpenIds}
          className="gap-1"
        >
          {GUIDE_GROUP_ORDER.map((group) => {
            const guides = visibleGuides.filter((guide) => guide.group === group);
            if (guides.length === 0) return null;
            return (
              <React.Fragment key={group}>
                <h2 className="mt-4 mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase first:mt-0">
                  {GUIDE_GROUP_LABEL[group]}
                </h2>
                <div className="rounded-xl border border-border/60 bg-card/40 px-4">
                  {guides.map((guide) => (
                    <AccordionItem
                      key={guide.id}
                      value={guide.id}
                      id={anchorId(guide.id)}
                      className="scroll-mt-4"
                    >
                      <AccordionTrigger className="items-center gap-3 py-4">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <guide.icon className="size-4" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-sm font-medium">{guide.title}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {guide.summary}
                          </span>
                        </span>
                      </AccordionTrigger>
                      {/* h-auto: the primitive pins this box to the height measured
                          on open, which would clip the FAQ <details> as they expand. */}
                      <AccordionContent className="h-auto pt-2 pb-5 sm:pl-12">
                        <GuideBody guide={guide} onOpenGuide={goToGuide} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </div>
              </React.Fragment>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
