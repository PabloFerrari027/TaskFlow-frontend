"use client";

import * as React from "react";

const STORAGE_KEY = "taskflow.sidebarCollapsed";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

// Whether the desktop sidebar is hidden. Purely a per-browser display
// preference — persisted to localStorage, never synced with the server.
// (On small screens the sidebar is a drawer opened from the topbar instead.)
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    Promise.resolve().then(() => {
      try {
        if (window.localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
      } catch {
        // ignore unavailable storage
      }
    });
  }, []);

  const toggle = React.useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore unavailable storage
      }
      return next;
    });
  }, []);

  const value = React.useMemo(() => ({ collapsed, toggle }), [collapsed, toggle]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
}
