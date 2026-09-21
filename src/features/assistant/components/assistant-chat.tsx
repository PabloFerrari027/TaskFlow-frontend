"use client";

import * as React from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getErrorCode, getMessageForCode } from "@/lib/errors";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useSendChatMessageMutation } from "@/features/assistant/hooks/use-assistant";
import { AssistantMessage } from "@/features/assistant/components/assistant-message";
import { AssistantSessionSummary } from "@/features/assistant/components/assistant-session-summary";
import type {
  ChatMessage,
  ChatTranscriptMessage,
  ConfirmedActionSummary,
  PendingActionLocalStatus,
} from "@/features/assistant/types";

const MAX_MESSAGE_LENGTH = 2000;

interface ChatState {
  transcript: ChatTranscriptMessage[];
  confirmedActions: ConfirmedActionSummary[];
}

const INITIAL_STATE: ChatState = { transcript: [], confirmedActions: [] };

type ChatAction =
  | { type: "add"; message: ChatTranscriptMessage }
  | { type: "set-pending-status"; messageId: string; actionId: string; status: PendingActionLocalStatus }
  | { type: "reset" };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "add":
      return { ...state, transcript: [...state.transcript, action.message] };
    case "set-pending-status": {
      // Confirming an action appends it to the session's summary right here
      // — no backend call needed, everything the summary needs (tool,
      // humanDescription) is already in the transcript.
      let confirmed: ConfirmedActionSummary | null = null;
      const transcript = state.transcript.map((message) => {
        if (message.id !== action.messageId) return message;
        return {
          ...message,
          pendingActions: message.pendingActions?.map((pendingAction) => {
            if (pendingAction.id !== action.actionId) return pendingAction;
            if (action.status === "confirmed") {
              confirmed = {
                tool: pendingAction.tool,
                humanDescription: pendingAction.humanDescription,
                confirmedAt: new Date().toISOString(),
              };
            }
            return { ...pendingAction, status: action.status };
          }),
        };
      });
      return {
        transcript,
        confirmedActions: confirmed
          ? [...state.confirmedActions, confirmed]
          : state.confirmedActions,
      };
    }
    case "reset":
      return INITIAL_STATE;
  }
}

// Conversation state is ephemeral by design (API.md § 16: no persisted
// history, stateless backend) — but `AssistantChat` itself never unmounts
// (rendered unconditionally by the topbar), so nothing resets on its own
// just from closing the Sheet. `handleOpenChange` below explicitly wipes
// the reducer on close, which is what actually makes it ephemeral per
// session instead of surviving for the whole app lifetime.
export function AssistantChat() {
  const [open, setOpen] = React.useState(false);
  const [showSummary, setShowSummary] = React.useState(false);
  // The AI provider refused the call for lack of credits/quota: retrying is
  // pointless, so the composer stays locked until the sheet is reopened.
  const [creditsExhausted, setCreditsExhausted] = React.useState(false);
  const { workspace } = useCurrentWorkspace();
  const [text, setText] = React.useState("");
  const [state, dispatch] = React.useReducer(chatReducer, INITIAL_STATE);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const sendMutation = useSendChatMessageMutation(workspace?.id ?? "");
  const assistantEnabled = workspace?.assistantEnabled ?? false;
  const composerDisabled = sendMutation.isPending || !assistantEnabled || creditsExhausted;

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [state.transcript, sendMutation.isPending]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setShowSummary(false);
      setCreditsExhausted(false);
      dispatch({ type: "reset" });
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || composerDisabled || !workspace) return;

    const history: ChatMessage[] = state.transcript.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    dispatch({
      type: "add",
      message: { id: crypto.randomUUID(), role: "user", content: trimmed },
    });
    setText("");

    sendMutation.mutate(
      { message: trimmed, history },
      {
        onSuccess: (data) => {
          dispatch({
            type: "add",
            message: {
              id: crypto.randomUUID(),
              role: "assistant",
              content: data.reply,
              executedActions: data.executedActions,
              pendingActions: data.pendingActions.map((pendingAction) => ({
                ...pendingAction,
                status: "pending",
              })),
            },
          });
        },
        onError: (error) => {
          if (getErrorCode(error) === "AI_INSUFFICIENT_CREDITS") setCreditsExhausted(true);
        },
      }
    );
  }

  function handlePendingActionStatusChange(
    messageId: string,
    actionId: string,
    status: PendingActionLocalStatus
  ) {
    dispatch({ type: "set-pending-status", messageId, actionId, status });
  }

  const confirmedCount = state.confirmedActions.length;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir assistente de IA"
          data-tour="assistant"
        >
          <Sparkles />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="gap-2 border-b border-border/60">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Assistente
          </SheetTitle>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {confirmedCount} ação(ões) confirmada(s) nesta conversa
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={confirmedCount === 0}
              onClick={() => setShowSummary(true)}
            >
              Encerrar e revisar
            </Button>
          </div>
        </SheetHeader>

        {showSummary ? (
          <AssistantSessionSummary
            confirmedActions={state.confirmedActions}
            onClose={() => handleOpenChange(false)}
          />
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {!workspace ? null : !assistantEnabled ? (
                <p className="text-sm text-muted-foreground">
                  O assistente está desligado neste workspace. Peça a um OWNER para
                  habilitá-lo na aba &quot;Assistente&quot; das configurações do workspace.
                </p>
              ) : state.transcript.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Pergunte algo ou peça uma ação sobre este workspace — toda alteração pede
                  sua confirmação explícita antes de acontecer.
                </p>
              ) : (
                state.transcript.map((message) => (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    workspaceId={workspace.id}
                    onPendingActionStatusChange={(actionId, status) =>
                      handlePendingActionStatusChange(message.id, actionId, status)
                    }
                  />
                ))
              )}
              {sendMutation.isPending ? (
                <p className="text-sm text-muted-foreground">Digitando...</p>
              ) : null}
              {creditsExhausted ? (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {getMessageForCode("AI_INSUFFICIENT_CREDITS")}
                </p>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border/60 p-4">
              <Input
                value={text}
                onChange={(event) => setText(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Escreva uma mensagem..."
                disabled={composerDisabled}
              />
              <Button
                type="submit"
                size="icon"
                disabled={composerDisabled || !text.trim()}
              >
                <Send />
              </Button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
