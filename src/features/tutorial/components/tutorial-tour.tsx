"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTutorial } from "@/features/tutorial/context/tutorial-context";
import { TOUR_STEPS, type TourStep } from "@/features/tutorial/lib/tour-steps";

const SPOTLIGHT_PADDING = 6;
const CARD_GAP = 12;
const CARD_WIDTH = 340;
const VIEWPORT_MARGIN = 16;
// Rough height, only used to keep a side/top-placed card from overflowing
// the screen and to decide whether a placement needs to flip.
const CARD_MAX_HEIGHT = 440;

// How long we wait for a step's target to show up before giving up on it.
// Steps that just navigated to a new page need real time for the route's
// data queries to resolve; steps checked right where we already are (most
// auto-skips, cascading through a section with no data) fail fast instead of
// stalling the tour.
const TARGET_TIMEOUT_AFTER_NAV_MS = 2500;
const TARGET_TIMEOUT_SAME_PAGE_MS = 500;
const POLL_INTERVAL_MS = 90;

function findTarget(id: string): HTMLElement | null {
  const element = document.querySelector<HTMLElement>(`[data-tour="${id}"]`);
  if (!element) return null;
  const { width, height } = element.getBoundingClientRect();
  return width > 0 && height > 0 ? element : null;
}

async function pollForTarget(
  id: string,
  timeoutMs: number,
  isCancelled: () => boolean
): Promise<HTMLElement | null> {
  const start = Date.now();
  for (;;) {
    const el = findTarget(id);
    if (el || isCancelled()) return el;
    if (Date.now() - start >= timeoutMs) return null;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function getCardStyle(step: TourStep, rect: DOMRect | null): React.CSSProperties {
  const width = Math.min(CARD_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
  if (!rect) return { width };

  const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
  const clampLeft = (value: number) => clamp(value, VIEWPORT_MARGIN, maxLeft);
  const maxTop = window.innerHeight - CARD_MAX_HEIGHT - VIEWPORT_MARGIN;
  const clampTop = (value: number) => clamp(value, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, maxTop));
  const placement = step.placement ?? "bottom";

  if (placement === "left" || placement === "right") {
    const fitsRight = rect.right + CARD_GAP + width <= window.innerWidth - VIEWPORT_MARGIN;
    const fitsLeft = rect.left - CARD_GAP - width >= VIEWPORT_MARGIN;
    const goRight = placement === "left" ? !fitsLeft : fitsRight || !fitsLeft;
    return {
      width,
      left: goRight ? clampLeft(rect.right + CARD_GAP) : clampLeft(rect.left - CARD_GAP - width),
      top: clampTop(rect.top),
    };
  }

  const fitsBelow = rect.bottom + CARD_GAP + CARD_MAX_HEIGHT <= window.innerHeight - VIEWPORT_MARGIN;
  const fitsAbove = rect.top - CARD_GAP - CARD_MAX_HEIGHT >= VIEWPORT_MARGIN;
  const goBelow = placement === "top" ? !fitsAbove : fitsBelow || !fitsAbove;
  // Both branches go through clampTop — a target much taller than the
  // viewport (e.g. a long chart grid) would otherwise place the card at
  // `rect.bottom`, which can sit far past the bottom of the screen.
  return {
    width,
    left: clampLeft(rect.left),
    top: clampTop(goBelow ? rect.bottom + CARD_GAP : rect.top - CARD_GAP - CARD_MAX_HEIGHT),
  };
}

export function TutorialTour() {
  const { isTourOpen } = useTutorial();
  // Mounted only while open so it always starts fresh against the page the
  // tour was opened from (and never during SSR).
  return isTourOpen ? <TourOverlay /> : null;
}

type TourPhase = "measuring" | "ready";

function TourOverlay() {
  const { closeTour } = useTutorial();
  const router = useRouter();
  const pathname = usePathname();

  const [index, setIndex] = React.useState(0);
  const [phase, setPhase] = React.useState<TourPhase>("measuring");
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const primaryRef = React.useRef<HTMLButtonElement>(null);
  // +1/-1: whether the last user action moved forward or backward, so an
  // auto-skipped step (missing target) skips in that same direction instead
  // of always forward.
  const directionRef = React.useRef<1 | -1>(1);
  // Whether *entering* a given step index performed a real navigation (a
  // `router.push`) — set the moment we push, read again if the tour later
  // backs out of that step, so it can undo the push with `router.back()`
  // instead of trying to recompute and re-assert a "current" URL (which
  // fights any redirect the destination page does on its own, e.g. a
  // project's bare URL bouncing to its tasks tab).
  const navEnteredRef = React.useRef<Record<number, boolean>>({});
  // Whether we just triggered a route change to reach the current index, so
  // the target-search below knows to wait longer for the new page to load.
  const navigatingRef = React.useRef(false);

  const step = TOUR_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === TOUR_STEPS.length - 1;

  // Resets the card to its loading state as soon as the step changes, before
  // the effect below does any async work — done during render, with state
  // (not a ref) tracking the previous index, exactly as React's own docs
  // recommend for adjusting state when a prop changes.
  const [lastResetIndex, setLastResetIndex] = React.useState(index);
  if (lastResetIndex !== index) {
    setLastResetIndex(index);
    setPhase("measuring");
    setRect(null);
  }

  // Enters `newIndex` going forward: navigates there first if it (or an
  // "advance" link just followed out of the step being left) points
  // somewhere new, then switches the step.
  const enterForward = (newIndex: number, hrefOverride?: string) => {
    const newStep = TOUR_STEPS[newIndex];
    const url = hrefOverride ?? newStep.route;
    const needsNav = Boolean(url) && url !== pathname;
    navEnteredRef.current[newIndex] = needsNav;
    if (needsNav) {
      navigatingRef.current = true;
      router.push(url as string);
    }
    setIndex(newIndex);
  };

  // Leaves `oldIndex` going backward: undoes whatever navigation was used to
  // enter it (if any) via real browser history, then switches the step.
  const enterBackward = (newIndex: number, oldIndex: number) => {
    if (navEnteredRef.current[oldIndex]) {
      navigatingRef.current = true;
      router.back();
    }
    setIndex(newIndex);
  };

  const next = () => {
    if (phase !== "ready") return;
    let hrefOverride: string | undefined;
    if (step.advance === "open") {
      const el = step.target ? findTarget(step.target) : null;
      hrefOverride = el?.getAttribute("href") ?? el?.getAttribute("data-tour-href") ?? undefined;
    }
    directionRef.current = 1;
    if (isLast) {
      closeTour("completed");
      return;
    }
    enterForward(index + 1, hrefOverride);
  };

  const back = () => {
    if (phase !== "ready" || isFirst) return;
    directionRef.current = -1;
    enterBackward(index - 1, index);
  };

  // Resolves each step: search for its target on whatever page we're on.
  // Steps whose target never shows up (no project/task/workspace to
  // demonstrate with yet) are skipped automatically when `skipIfMissing` is
  // set — in the same direction the tour was already moving.
  React.useEffect(() => {
    let cancelled = false;

    const timeoutMs = navigatingRef.current ? TARGET_TIMEOUT_AFTER_NAV_MS : TARGET_TIMEOUT_SAME_PAGE_MS;
    navigatingRef.current = false;

    (async () => {
      if (!step.target) {
        setPhase("ready");
        return;
      }
      const target = step.target;
      const el = await pollForTarget(target, timeoutMs, () => cancelled);
      if (cancelled) return;
      if (el) {
        el.scrollIntoView({ block: "center" });
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (cancelled) return;
        setRect(el.getBoundingClientRect());
        setPhase("ready");
        return;
      }
      if (step.skipIfMissing) {
        const dir = directionRef.current;
        const target = clamp(index + dir, 0, TOUR_STEPS.length - 1);
        if (dir === 1) enterForward(target);
        else enterBackward(target, index);
        return;
      }
      setPhase("ready");
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Keeps the spotlight in sync with layout shifts while a step is on
  // screen (sidebar collapsing, window resize, scrolling the board…).
  React.useEffect(() => {
    if (phase !== "ready" || !step.target) return;
    const target = step.target;
    const measure = () => {
      const el = findTarget(target);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [index, phase, step.target]);

  // Declared before the focus effect below so it captures the element that had
  // focus *before* the tour moved it.
  React.useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => previouslyFocused?.focus?.();
  }, []);

  React.useEffect(() => {
    if (phase === "ready") primaryRef.current?.focus();
  }, [index, phase]);

  // No deps array on purpose: always re-subscribes with the latest
  // next/back/closeTour closures instead of capturing stale ones.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTour("skipped");
      else if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Keeps Tab inside the card: the rest of the page is covered and inert.
  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
      "button:not([disabled]), a[href]"
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (phase === "measuring") {
    return createPortal(
      <div className="pointer-events-auto fixed inset-0 z-100">
        <div className="absolute inset-0 bg-black/60" />
        <div className="fixed top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10">
          <Loader2 className="size-4 animate-spin" />
          Carregando…
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-100">
      {/* Also swallows clicks so the page underneath can't be used mid-tour. */}
      <div className={cn("absolute inset-0", !rect && "bg-black/60")} />

      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-lg ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] motion-safe:transition-all motion-safe:duration-200"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
          }}
        />
      ) : null}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-description"
        onKeyDown={trapFocus}
        className={cn(
          "fixed max-h-[calc(100vh-2rem)] space-y-3 overflow-y-auto rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10",
          !rect && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        style={getCardStyle(step, rect)}
      >
        <div className="space-y-1.5 pr-6">
          <p className="text-xs font-medium text-primary uppercase">{step.chapter}</p>
          <h2 id="tour-title" className="text-base font-semibold">
            {step.title}
          </h2>
          <p id="tour-description" className="text-muted-foreground">
            {step.description}
          </p>
          {step.details ? (
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              {step.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Fechar tour"
          className="absolute top-3 right-3"
          onClick={() => closeTour("skipped")}
        >
          <X />
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Passo {index + 1} de {TOUR_STEPS.length}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isLast ? (
              <Button variant="outline" asChild>
                <Link href="/tutorial" onClick={() => closeTour("completed")}>
                  Ver tutorial
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => closeTour("skipped")}>
                Pular
              </Button>
            )}
            {!isFirst ? (
              <Button variant="outline" onClick={back}>
                Voltar
              </Button>
            ) : null}
            <Button ref={primaryRef} onClick={next}>
              {isLast ? "Concluir" : isFirst ? "Começar" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
