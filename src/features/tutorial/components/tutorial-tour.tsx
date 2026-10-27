"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlarmClock,
  Armchair,
  BookOpen,
  Briefcase,
  Building2,
  Cake,
  CalendarClock,
  CircleCheck,
  Columns3,
  Compass,
  FolderKanban,
  FolderPlus,
  GraduationCap,
  HeartPulse,
  House,
  Loader2,
  MessageSquareText,
  PartyPopper,
  Pill,
  Receipt,
  ShoppingBag,
  Sparkles,
  SquareCheckBig,
  Store,
  Users,
  UsersRound,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { foldersService } from "@/features/folders/api/folders-service";
import { itemsService } from "@/features/items/api/items-service";
import { assistantService } from "@/features/assistant/api/assistant-service";
import { folderTemplatesService } from "@/features/folder-templates/api/folder-templates-service";
import {
  PROFILE_QUESTIONS,
  responseLengthFromAnswers,
  summaryFromAnswers,
  templateNamesFromAnswers,
  type ProfileAnswer,
  type ProfileAnswers,
  type ProfileQuestion,
  type ProfileQuestionId,
} from "@/features/tutorial/lib/profile-questions";
import type { FolderTemplateSummary } from "@/types/folder-template";
import { useOptionalCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useTutorial } from "@/features/tutorial/context/tutorial-context";
import { useAssistantChat } from "@/features/assistant/context/assistant-chat-context";
import { TOUR_STEPS, type TourStep } from "@/features/tutorial/lib/tour-steps";

const SPOTLIGHT_PADDING = 6;
const CARD_GAP = 12;
const CARD_WIDTH = 420;
const VIEWPORT_MARGIN = 16;
// First guess of the card height, until the rendered card is measured (see
// `cardHeight`) — used to keep it on screen and to decide whether to flip.
const CARD_MAX_HEIGHT = 520;

// The picture on each chapter's card, so the parts of the tour read apart.
const CHAPTER_ICONS: Record<string, LucideIcon> = {
  "Boas-vindas": Sparkles,
  Navegação: Compass,
  Pastas: FolderKanban,
  "O quadro": Columns3,
  "O item": SquareCheckBig,
  Workspaces: Building2,
  Pronto: PartyPopper,
};

// How long we wait for a step's target to show up before giving up on it.
// Steps that just navigated to a new page need real time for the route's
// data queries to resolve; steps checked right where we already are (most
// auto-skips, cascading through a section with no data) fail fast instead of
// stalling the tour. A folder with many items (a ready template) took longer
// than 2,5 s to show its board, and the whole board/item part was skipped;
// empty accounts no longer reach those steps (the first-folder offer), so the
// longer wait only happens when there is something to show.
const TARGET_TIMEOUT_AFTER_NAV_MS = 6000;
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

// `cardHeight`: the card as rendered — a long step (six tips) is far taller
// than the estimate, and placing it by the estimate pushed its buttons off
// the bottom of the screen.
function getCardStyle(step: TourStep, rect: DOMRect | null, cardHeight: number): React.CSSProperties {
  const width = Math.min(CARD_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
  if (!rect) return { width };

  const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
  const clampLeft = (value: number) => clamp(value, VIEWPORT_MARGIN, maxLeft);
  const maxTop = window.innerHeight - cardHeight - VIEWPORT_MARGIN;
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

  const fitsBelow = rect.bottom + CARD_GAP + cardHeight <= window.innerHeight - VIEWPORT_MARGIN;
  const fitsAbove = rect.top - CARD_GAP - cardHeight >= VIEWPORT_MARGIN;
  const goBelow = placement === "top" ? !fitsAbove : fitsBelow || !fitsAbove;
  // Both branches go through clampTop — a target much taller than the
  // viewport (e.g. a long chart grid) would otherwise place the card at
  // `rect.bottom`, which can sit far past the bottom of the screen.
  return {
    width,
    left: clampLeft(rect.left),
    top: clampTop(goBelow ? rect.bottom + CARD_GAP : rect.top - CARD_GAP - cardHeight),
  };
}

export function TutorialTour() {
  const { isTourOpen } = useTutorial();
  // Mounted only while open so it always starts fresh against the page the
  // tour was opened from (and never during SSR).
  return isTourOpen ? <TourOverlay /> : null;
}

type TourPhase = "measuring" | "ready";

// The first folder the tour offers to an account with no folder yet, so the
// board and item steps show something real: a ready template that fits the
// "Sobre você" answers, or else this plain example folder (deletable, never
// assigned).
const EXAMPLE_FOLDER = {
  name: "Exemplo do tour",
  description: "Criada pelo tour de boas-vindas — pode apagar quando quiser.",
};
const EXAMPLE_ITEMS = [
  { title: "Conhecer o quadro", description: "Arraste este cartão para outra coluna para mudar a etapa dele." },
  { title: "Abrir um item por dentro", description: "Clique num cartão para ver título, descrição, prazo e comentários." },
  { title: "Apagar esta pasta quando terminar", description: "Ela é só um exemplo: arquive quando não precisar mais." },
];

// Sections dropped together when the person declines the first folder.
const BOARD_SECTIONS = ["example", "folder", "item"];

// A template instantiation may be queued: how long to wait for its folder.
const INSTANTIATION_POLL_MS = 500;
const INSTANTIATION_MAX_POLLS = 40;

const EMPTY_ANSWER: ProfileAnswer = { optionIds: [], other: "" };

// One picture per answer, so the choices read at a glance.
const OPTION_ICONS: Record<string, LucideIcon> = {
  job: Briefcase,
  own: Store,
  study: GraduationCap,
  home: House,
  retired: Armchair,
  money: Wallet,
  health: HeartPulse,
  studies: BookOpen,
  sales: ShoppingBag,
  family: Users,
  team: UsersRound,
  bills: Receipt,
  medicine: Pill,
  appointments: CalendarClock,
  deadlines: AlarmClock,
  dates: Cake,
  SHORT: Zap,
  DETAILED: MessageSquareText,
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function TourOverlay() {
  const { closeTour } = useTutorial();
  const { openChat } = useAssistantChat();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const workspaceId = useOptionalCurrentWorkspace()?.workspaceId ?? null;
  // Sections left out of this run (no example folder wanted, or no need for
  // the offer): their steps are skipped at once and not counted.
  const [skippedSections, setSkippedSections] = React.useState<ReadonlySet<string>>(() => new Set());
  const [creatingFolder, setCreatingFolder] = React.useState(false);
  const [answers, setAnswers] = React.useState<ProfileAnswers>({});
  const [savingProfile, setSavingProfile] = React.useState(false);
  // The template the first-folder step proposes (null = the example folder).
  const [folderProposal, setFolderProposal] = React.useState<FolderTemplateSummary | null>(null);

  const [index, setIndex] = React.useState(0);
  const [phase, setPhase] = React.useState<TourPhase>("measuring");
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const primaryRef = React.useRef<HTMLButtonElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = React.useState(CARD_MAX_HEIGHT);
  // +1/-1: whether the last user action moved forward or backward, so an
  // auto-skipped step (missing target) skips in that same direction instead
  // of always forward.
  const directionRef = React.useRef<1 | -1>(1);
  // Whether *entering* a given step index performed a real navigation (a
  // `router.push`) — set the moment we push, read again if the tour later
  // backs out of that step, so it can undo the push with `router.back()`
  // instead of trying to recompute and re-assert a "current" URL (which
  // fights any redirect the destination page does on its own, e.g. a
  // folder's bare URL bouncing to its items tab).
  const navEnteredRef = React.useRef<Record<number, boolean>>({});
  // Whether we just triggered a route change to reach the current index, so
  // the target-search below knows to wait longer for the new page to load.
  const navigatingRef = React.useRef(false);

  const step = TOUR_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === TOUR_STEPS.length - 1;

  const isSkipped = (i: number, skipped: ReadonlySet<string> = skippedSections) => {
    const section = TOUR_STEPS[i].section;
    return Boolean(section && skipped.has(section));
  };
  // The next step in `dir` that this run still shows.
  const neighbour = (from: number, dir: 1 | -1, skipped: ReadonlySet<string> = skippedSections) => {
    let i = from + dir;
    while (i > 0 && i < TOUR_STEPS.length - 1 && isSkipped(i, skipped)) i += dir;
    return clamp(i, 0, TOUR_STEPS.length - 1);
  };
  const shownSteps = TOUR_STEPS.map((_, i) => i).filter((i) => !isSkipped(i));
  const position = shownSteps.indexOf(index) + 1;

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
    enterForward(neighbour(index, 1), hrefOverride);
  };

  const back = () => {
    if (phase !== "ready" || isFirst) return;
    directionRef.current = -1;
    enterBackward(neighbour(index, -1), index);
  };

  // Moves on with more sections left out — they never show nor count.
  const skipSections = (sections: string[], dir: 1 | -1) => {
    const skipped = new Set([...skippedSections, ...sections]);
    setSkippedSections(skipped);
    const target = neighbour(index, dir, skipped);
    if (dir === 1) enterForward(target);
    else enterBackward(target, index);
  };

  const createFirstFolder = async () => {
    if (!workspaceId || creatingFolder) return;
    setCreatingFolder(true);
    try {
      if (folderProposal) {
        const started = await folderTemplatesService.instantiate(workspaceId, folderProposal.id, { name: folderProposal.name });
        let folderId = started.folderId;
        for (let poll = 0; !folderId && poll < INSTANTIATION_MAX_POLLS; poll++) {
          await wait(INSTANTIATION_POLL_MS);
          const run = await folderTemplatesService.getInstantiation(workspaceId, started.instantiationId);
          if (run.status === "FAILED") throw new Error("Não foi possível criar a pasta agora. Tente de novo.");
          folderId = run.folderId;
        }
        if (!folderId) throw new Error("A pasta está demorando para ficar pronta. Tente de novo em instantes.");
      } else {
        const folder = await foldersService.create(workspaceId, EXAMPLE_FOLDER);
        for (const item of EXAMPLE_ITEMS) await itemsService.create(folder.id, item);
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.folders.all(workspaceId) });
      directionRef.current = 1;
      // The folder list reloads in place: give the next step the longer wait.
      navigatingRef.current = true;
      enterForward(index + 1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCreatingFolder(false);
    }
  };

  const answerFor = (id: ProfileQuestionId) => answers[id] ?? EMPTY_ANSWER;
  const setAnswer = (id: ProfileQuestionId, answer: ProfileAnswer) =>
    setAnswers((previous) => ({ ...previous, [id]: answer }));
  const toggleOption = (question: ProfileQuestion, optionId: string) => {
    const answer = answerFor(question.id);
    const optionIds = !question.multiple
      ? [optionId]
      : answer.optionIds.includes(optionId)
        ? answer.optionIds.filter((id) => id !== optionId)
        : [...answer.optionIds, optionId];
    setAnswer(question.id, { ...answer, optionIds });
  };

  // What was answered so far becomes what the assistant knows about the
  // person (and how long its replies are). Nothing answered, nothing saved; a
  // failure only warns — the tour goes on.
  const saveProfile = async () => {
    const summary = summaryFromAnswers(answers);
    if (!summary) return;
    setSavingProfile(true);
    try {
      await assistantService.updateProfile(summary);
      const responseLength = responseLengthFromAnswers(answers);
      if (responseLength) await assistantService.updatePreferences({ responseLength });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assistantConversation.profile() });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  // "Salvar e continuar" on the last question goes on as any step (the count
  // keeps the questions); "Pular perguntas" leaves the rest of them out.
  const finishQuestions = async () => {
    await saveProfile();
    directionRef.current = 1;
    if (isLastQuestion) enterForward(neighbour(index, 1));
    else skipSections(["about"], 1);
  };

  // Resolves each step: search for its target on whatever page we're on.
  // Steps whose target never shows up (no folder/item/workspace to
  // demonstrate with yet) are skipped automatically when `skipIfMissing` is
  // set — in the same direction the tour was already moving.
  React.useEffect(() => {
    let cancelled = false;

    const timeoutMs = navigatingRef.current ? TARGET_TIMEOUT_AFTER_NAV_MS : TARGET_TIMEOUT_SAME_PAGE_MS;
    navigatingRef.current = false;

    (async () => {
      if (step.kind === "profile-question") {
        // Asked once: when the assistant already knows the person (an earlier
        // tour or the chat), the whole "Sobre você" part goes away.
        if (step.questionId === PROFILE_QUESTIONS[0].id) {
          const known = await assistantService
            .getProfile()
            .then((profile) => Boolean(profile.summary))
            .catch(() => false);
          if (cancelled) return;
          if (known) {
            skipSections(["about"], directionRef.current);
            return;
          }
        }
        setPhase("ready");
        return;
      }
      if (step.kind === "first-folder") {
        // Only offered to an empty workspace; anyone else goes straight on.
        const hasFolders = workspaceId
          ? await foldersService
              .listByWorkspace(workspaceId, { limit: 1 })
              .then((page) => page.data.length > 0)
              .catch(() => true)
          : true;
        if (cancelled) return;
        if (hasFolders) {
          skipSections(["example"], directionRef.current);
          return;
        }
        let proposal: FolderTemplateSummary | null = null;
        for (const name of templateNamesFromAnswers(answers)) {
          const page = await folderTemplatesService.list({ search: name, limit: 5 }).catch(() => null);
          if (cancelled) return;
          const match = page?.data.find((template) => template.name.toLowerCase() === name.toLowerCase());
          if (match) {
            proposal = match;
            break;
          }
        }
        setFolderProposal(proposal);
        setPhase("ready");
        return;
      }
      if (isFirst) {
        // Before the welcome card: leave out what this account does not need
        // (the questions when the assistant already knows them, the folder
        // offer when there are folders), so the count is right from "1 de N".
        const [knowsPerson, hasFolders] = await Promise.all([
          assistantService
            .getProfile()
            .then((profile) => Boolean(profile.summary))
            .catch(() => false),
          workspaceId
            ? foldersService
                .listByWorkspace(workspaceId, { limit: 1 })
                .then((page) => page.data.length > 0)
                .catch(() => false)
            : Promise.resolve(false),
        ]);
        if (cancelled) return;
        const known = [...(knowsPerson ? ["about"] : []), ...(hasFolders ? ["example"] : [])];
        if (known.length > 0) setSkippedSections((previous) => new Set([...previous, ...known]));
      }
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
        const target = neighbour(index, dir);
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

  // Re-measures the card once a step is on screen; placement then uses its
  // real height (capped to the viewport — taller cards scroll inside).
  React.useLayoutEffect(() => {
    if (phase !== "ready" || !cardRef.current) return;
    const height = Math.min(cardRef.current.offsetHeight, window.innerHeight - VIEWPORT_MARGIN * 2);
    if (Math.abs(height - cardHeight) > 1) setCardHeight(height);
  }, [phase, index, rect, cardHeight]);

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
      // Arrows move the cursor while typing an "outro" answer, not the tour.
      const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
      if (typing && event.key !== "Escape") return;
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
      "button:not([disabled]), a[href], input"
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

  const question =
    step.kind === "profile-question" ? PROFILE_QUESTIONS.find((q) => q.id === step.questionId) : undefined;
  const isLastQuestion = question?.id === PROFILE_QUESTIONS[PROFILE_QUESTIONS.length - 1].id;
  const busy = savingProfile || creatingFolder;
  let title = step.title;
  let description = step.description;
  if (question) {
    title = question.title;
    description = question.hint;
  } else if (step.kind === "first-folder") {
    title = folderProposal ? "Que tal começar por esta pasta?" : "Vamos usar uma pasta de exemplo?";
    description = folderProposal
      ? "Pelo que você contou, este é um bom começo. Dá para mudar tudo depois."
      : "Você ainda não tem nenhuma pasta. Com uma de exemplo, dá para ver o quadro e um item por dentro.";
  }

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

  // "Sobre você" and the first-folder offer are conversations, not pointers
  // at the screen: a roomy card of their own, big enough to read and tap.
  if (question || step.kind === "first-folder") {
    const questionNumber = question ? PROFILE_QUESTIONS.indexOf(question) + 1 : 0;
    const HeaderIcon = question ? Sparkles : FolderPlus;
    return createPortal(
      <div className="pointer-events-auto fixed inset-0 z-100 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-title"
          aria-describedby="tour-description"
          onKeyDown={trapFocus}
          className="relative max-h-[calc(100vh-2rem)] w-full max-w-xl space-y-6 overflow-y-auto rounded-2xl bg-popover p-6 text-popover-foreground shadow-2xl ring-1 ring-foreground/10 sm:p-8"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Fechar tour"
            className="absolute top-4 right-4"
            onClick={() => closeTour("skipped")}
          >
            <X />
          </Button>

          <div className="space-y-4 pr-8">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HeaderIcon className="size-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-sm font-medium text-primary">
                  {question ? `Sobre você · pergunta ${questionNumber} de ${PROFILE_QUESTIONS.length}` : "Sua primeira pasta"}
                </p>
                {question ? (
                  <div className="flex gap-1.5" aria-hidden>
                    {PROFILE_QUESTIONS.map((q, i) => (
                      <span
                        key={q.id}
                        className={cn("h-1.5 flex-1 rounded-full", i < questionNumber ? "bg-primary" : "bg-muted")}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <h2 id="tour-title" className="text-2xl font-semibold tracking-tight">
                {title}
              </h2>
              <p id="tour-description" className="text-base text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          {question ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label={question.title}>
                {question.options.map((option) => {
                  const selected = answerFor(question.id).optionIds.includes(option.id);
                  const OptionIcon = OPTION_ICONS[option.id] ?? Sparkles;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleOption(question, option.id)}
                      className={cn(
                        "flex min-h-14 items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-base transition-colors",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40 hover:bg-muted/60"
                      )}
                    >
                      <OptionIcon className={cn("size-5 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                      <span className="min-w-0 flex-1">{option.label}</span>
                      {selected ? <CircleCheck className="size-5 shrink-0 text-primary" /> : null}
                    </button>
                  );
                })}
              </div>
              {question.otherPlaceholder ? (
                <div className="space-y-1.5">
                  <label htmlFor="tour-other" className="text-sm font-medium">
                    Outro
                  </label>
                  <Input
                    id="tour-other"
                    className="h-12 text-base"
                    value={answerFor(question.id).other}
                    onChange={(event) =>
                      setAnswer(question.id, { ...answerFor(question.id), other: event.target.value })
                    }
                    placeholder={question.otherPlaceholder}
                    maxLength={120}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-start gap-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <FolderKanban className="size-6" />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-lg font-semibold">{folderProposal?.name ?? EXAMPLE_FOLDER.name}</p>
                <p className="text-base text-muted-foreground">
                  {folderProposal
                    ? (folderProposal.description ?? "Um modelo pronto, já organizado em colunas.")
                    : "Uma pasta com 3 itens para você ver o quadro e um item por dentro. Dá para apagar quando quiser."}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              size="lg"
              className="text-muted-foreground"
              onClick={question ? finishQuestions : () => skipSections(BOARD_SECTIONS, 1)}
              disabled={busy}
            >
              {question ? "Pular perguntas" : "Agora não"}
            </Button>
            <div className="flex gap-2 sm:justify-end">
              <Button variant="outline" size="lg" className="flex-1 sm:flex-none" onClick={back} disabled={busy}>
                Voltar
              </Button>
              <Button
                ref={primaryRef}
                size="lg"
                className="flex-1 sm:flex-none"
                onClick={!question ? createFirstFolder : isLastQuestion ? finishQuestions : next}
                disabled={busy}
              >
                {busy ? <Loader2 className="animate-spin" /> : null}
                {step.kind === "first-folder" ? "Criar esta pasta" : isLastQuestion ? "Salvar e continuar" : "Próximo"}
              </Button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const ChapterIcon = CHAPTER_ICONS[step.chapter] ?? Sparkles;

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
          "fixed max-h-[calc(100vh-2rem)] space-y-5 overflow-y-auto rounded-2xl bg-popover p-6 text-popover-foreground shadow-2xl ring-1 ring-foreground/10",
          !rect && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        ref={cardRef}
        style={getCardStyle(step, rect, cardHeight)}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Fechar tour"
          className="absolute top-4 right-4"
          onClick={() => closeTour("skipped")}
        >
          <X />
        </Button>

        <div className="space-y-4 pr-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ChapterIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-medium text-primary">
                {step.chapter}
                <span className="font-normal text-muted-foreground">
                  {" · "}
                  {position} de {shownSteps.length}
                </span>
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div
                  className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-300"
                  style={{ width: `${(position / shownSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h2 id="tour-title" className="text-xl font-semibold tracking-tight">
              {title}
            </h2>
            <p id="tour-description" className="text-[15px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {step.details ? (
          <ul className="space-y-2.5 rounded-xl bg-muted/50 p-4 text-[15px] leading-snug">
            {step.details.map((detail) => (
              <li key={detail} className="flex gap-2.5">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {isLast ? (
            <Button variant="ghost" size="lg" className="text-muted-foreground" asChild>
              <Link href="/tutorial" onClick={() => closeTour("completed")}>
                Ver tutorial
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="lg" className="text-muted-foreground" onClick={() => closeTour("skipped")}>
              Pular tour
            </Button>
          )}
          <div className="flex items-center gap-2">
            {!isFirst ? (
              <Button variant="outline" size="lg" onClick={back}>
                Voltar
              </Button>
            ) : null}
            {isLast ? (
              // The way forward after the tour is a conversation: the chat
              // already knows what the person answered in "Sobre você".
              <Button
                ref={primaryRef}
                size="lg"
                onClick={() => {
                  closeTour("completed");
                  openChat();
                }}
              >
                <Sparkles /> Conversar agora
              </Button>
            ) : (
              <Button ref={primaryRef} size="lg" onClick={next}>
                {isFirst ? "Começar" : "Próximo"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
