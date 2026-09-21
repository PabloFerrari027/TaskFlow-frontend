"use client";

import * as React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTutorial } from "@/features/tutorial/context/tutorial-context";
import { TOUR_STEPS, type TourStep } from "@/features/tutorial/lib/tour-steps";

const SPOTLIGHT_PADDING = 6;
const CARD_GAP = 12;
const CARD_WIDTH = 320;
const VIEWPORT_MARGIN = 16;
// Rough height, only used to keep a side-placed card from overflowing the
// bottom of the screen.
const CARD_MAX_HEIGHT = 260;

function findTarget(id: string): HTMLElement | null {
  const element = document.querySelector<HTMLElement>(`[data-tour="${id}"]`);
  if (!element) return null;
  const { width, height } = element.getBoundingClientRect();
  return width > 0 && height > 0 ? element : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function getCardStyle(step: TourStep, rect: DOMRect | null): React.CSSProperties {
  const width = Math.min(CARD_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
  if (!rect) return { width };

  const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
  if (step.placement === "right") {
    return {
      width,
      left: clamp(rect.right + CARD_GAP, VIEWPORT_MARGIN, maxLeft),
      top: clamp(
        rect.top + VIEWPORT_MARGIN,
        VIEWPORT_MARGIN,
        window.innerHeight - CARD_MAX_HEIGHT - VIEWPORT_MARGIN
      ),
    };
  }
  return {
    width,
    left: clamp(rect.left, VIEWPORT_MARGIN, maxLeft),
    top: rect.bottom + SPOTLIGHT_PADDING + CARD_GAP,
  };
}

export function TutorialTour() {
  const { isTourOpen } = useTutorial();
  // Mounted only while open so the step list is resolved against the DOM as
  // it is at that moment (and never during SSR).
  return isTourOpen ? <TourOverlay /> : null;
}

function TourOverlay() {
  const { closeTour } = useTutorial();
  const [steps] = React.useState(() =>
    TOUR_STEPS.filter((step) => !step.target || findTarget(step.target))
  );
  const [index, setIndex] = React.useState(0);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const primaryRef = React.useRef<HTMLButtonElement>(null);

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const next = () => (isLast ? closeTour("completed") : setIndex(index + 1));
  const back = () => setIndex(Math.max(0, index - 1));

  React.useEffect(() => {
    const measure = () => {
      const target = step.target ? findTarget(step.target) : null;
      setRect(target ? target.getBoundingClientRect() : null);
    };
    if (step.target) {
      findTarget(step.target)?.scrollIntoView({ block: "nearest" });
    }
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  // Declared before the focus effect below so it captures the element that had
  // focus *before* the tour moved it.
  React.useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => previouslyFocused?.focus?.();
  }, []);

  React.useEffect(() => {
    primaryRef.current?.focus();
  }, [index]);

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

  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-[100]">
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
          "fixed space-y-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10",
          !rect && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        style={getCardStyle(step, rect)}
      >
        <div className="space-y-1.5 pr-6">
          <h2 id="tour-title" className="text-base font-semibold">
            {step.title}
          </h2>
          <p id="tour-description" className="text-muted-foreground">
            {step.description}
          </p>
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
            Passo {index + 1} de {steps.length}
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
