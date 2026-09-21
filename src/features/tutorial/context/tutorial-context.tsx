"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";

const STORAGE_PREFIX = "taskflow.tourSeen.";
// Lets the topbar/sidebar paint before the spotlight measures them.
const AUTO_START_DELAY_MS = 600;

type TourOutcome = "completed" | "skipped";

interface TutorialContextValue {
  isTourOpen: boolean;
  startTour: () => void;
  closeTour: (outcome: TourOutcome) => void;
}

const TutorialContext = React.createContext<TutorialContextValue | null>(null);

// Keyed by user so a second account on the same browser gets its own first-run
// tour. Purely a per-browser preference — persisted to localStorage, never
// synced with the server (the API has no user-preferences endpoint).
export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const { isLoading: isWorkspaceLoading } = useCurrentWorkspace();
  const [isTourOpen, setIsTourOpen] = React.useState(false);

  React.useEffect(() => {
    if (!userId || isWorkspaceLoading) return;

    let seen = true;
    try {
      seen = window.localStorage.getItem(STORAGE_PREFIX + userId) !== null;
    } catch {
      // Without storage we can't remember the tour was shown, so don't
      // auto-open it on every load.
    }
    if (seen) return;

    const timeout = window.setTimeout(
      () => setIsTourOpen(true),
      AUTO_START_DELAY_MS
    );
    return () => window.clearTimeout(timeout);
  }, [userId, isWorkspaceLoading]);

  const startTour = React.useCallback(() => setIsTourOpen(true), []);

  const closeTour = React.useCallback(
    (outcome: TourOutcome) => {
      setIsTourOpen(false);
      if (!userId) return;
      try {
        window.localStorage.setItem(STORAGE_PREFIX + userId, outcome);
      } catch {
        // ignore unavailable storage
      }
    },
    [userId]
  );

  const value = React.useMemo(
    () => ({ isTourOpen, startTour, closeTour }),
    [isTourOpen, startTour, closeTour]
  );

  return (
    <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = React.useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
