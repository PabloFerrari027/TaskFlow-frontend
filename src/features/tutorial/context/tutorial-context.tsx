"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useCurrentUserQuery } from "@/features/auth/hooks/use-current-user";
import { authService } from "@/features/auth/api/auth-service";
import { queryKeys } from "@/lib/query-keys";
import type { CurrentUserResponse } from "@/types/auth";

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

// "Seen" lives in the account (GET /auth/me `tourSeen`), so the tour doesn't
// come back on another device. localStorage stays as a fast local copy, keyed
// by user, and a browser that saw it before the account knew is synced up.
export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { isLoading: isWorkspaceLoading } = useCurrentWorkspace();
  const meQuery = useCurrentUserQuery({ enabled: Boolean(userId) });
  const tourSeenOnServer = meQuery.data?.tourSeen;
  const [isTourOpen, setIsTourOpen] = React.useState(false);

  const markSeenOnServer = React.useCallback(() => {
    queryClient.setQueryData<CurrentUserResponse>(queryKeys.auth.me(), (me) => (me ? { ...me, tourSeen: true } : me));
    authService.markTourSeen().catch(() => {
      // Best-effort: the local copy still keeps it from reopening here.
    });
  }, [queryClient]);

  React.useEffect(() => {
    if (!userId || isWorkspaceLoading || tourSeenOnServer === undefined) return;
    if (tourSeenOnServer) return;

    let seenHere = true;
    try {
      seenHere = window.localStorage.getItem(STORAGE_PREFIX + userId) !== null;
    } catch {
      // Without storage we can't remember the tour was shown, so don't
      // auto-open it on every load.
    }
    if (seenHere) {
      markSeenOnServer();
      return;
    }

    const timeout = window.setTimeout(
      () => setIsTourOpen(true),
      AUTO_START_DELAY_MS
    );
    return () => window.clearTimeout(timeout);
  }, [userId, isWorkspaceLoading, tourSeenOnServer, markSeenOnServer]);

  const startTour = React.useCallback(() => setIsTourOpen(true), []);

  const closeTour = React.useCallback(
    (outcome: TourOutcome) => {
      setIsTourOpen(false);
      if (!userId) return;
      markSeenOnServer();
      try {
        window.localStorage.setItem(STORAGE_PREFIX + userId, outcome);
      } catch {
        // ignore unavailable storage
      }
    },
    [userId, markSeenOnServer]
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
