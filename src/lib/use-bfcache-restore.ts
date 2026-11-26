"use client";

import * as React from "react";

/**
 * Runs `onRestore` when the browser restores this page from the back/forward
 * cache (`pageshow` with `persisted`). Leaving for Stripe and coming back with
 * the Back button brings the page back exactly as it was left — mutations
 * still in `isSuccess`, dialogs still locked — with no new mount to reset them.
 */
export function useBfcacheRestore(onRestore: () => void) {
  const latest = React.useRef(onRestore);
  React.useEffect(() => {
    latest.current = onRestore;
  });

  React.useEffect(() => {
    function handle(event: PageTransitionEvent) {
      if (event.persisted) latest.current();
    }
    window.addEventListener("pageshow", handle);
    return () => window.removeEventListener("pageshow", handle);
  }, []);
}
