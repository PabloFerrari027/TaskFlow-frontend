"use client";

import * as React from "react";

interface AssistantChatContextValue {
  open: boolean;
  // `draft` pre-fills the composer (e.g. a suggestion picked on the home
  // page) without sending it, so the user still reviews it first.
  openChat: (draft?: string) => void;
  setOpen: (open: boolean) => void;
  // `key` changes on every openChat(draft) so the same suggestion picked
  // twice still refills the composer.
  draft: { text: string; key: number } | null;
}

const AssistantChatContext = React.createContext<AssistantChatContextValue | null>(null);

// The assistant is one of the product's main features, so the chat can be
// opened from several places (topbar, sidebar, home, the Assistente page) —
// they all drive this one Sheet, rendered once by the topbar.
export function AssistantChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<{ text: string; key: number } | null>(null);

  const openChat = React.useCallback((nextDraft?: string) => {
    if (nextDraft) setDraft((current) => ({ text: nextDraft, key: (current?.key ?? 0) + 1 }));
    setOpen(true);
  }, []);

  // Ctrl+J / ⌘J from anywhere (Ctrl+K is already the search).
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key?.toLowerCase() === "j" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = React.useMemo(() => ({ open, openChat, setOpen, draft }), [open, openChat, draft]);

  return <AssistantChatContext.Provider value={value}>{children}</AssistantChatContext.Provider>;
}

export function useAssistantChat() {
  const context = React.useContext(AssistantChatContext);
  if (!context) throw new Error("useAssistantChat must be used inside AssistantChatProvider");
  return context;
}

// Starting points shown in the empty chat and on the home page. Written the
// way a lay person talks — no "item", "workspace" or "pasta" — each backed by
// a real assistant tool (list_agenda, create_recurring_reminder,
// save_information, folder templates).
export const ASSISTANT_SUGGESTIONS = [
  "O que eu tenho pra fazer hoje?",
  "Me lembra de tomar o remédio todo dia às 8h",
  "Anota pra mim: ",
  "Me ajuda a organizar minhas contas do mês",
];
