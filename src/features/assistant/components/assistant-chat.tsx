"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  CircleCheck,
  History,
  Loader2,
  Maximize2,
  Mic,
  Minimize2,
  Paperclip,
  Sparkles,
  Square,
  SquarePen,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getErrorCode, getMessageForCode } from "@/lib/errors";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import {
  useLoadAssistantConversationMutation,
  useSendChatMessageMutation,
} from "@/features/assistant/hooks/use-assistant";
import { useQuotaWindowUsageQuery } from "@/features/plans/hooks/use-plans";
import { useAudioRecorder } from "@/features/assistant/hooks/use-audio-recorder";
import { isAudioFile, validateNewFiles } from "@/features/assistant/lib/attachment-limits";
import { AssistantMessage } from "@/features/assistant/components/assistant-message";
import { AssistantConversationHistory } from "@/features/assistant/components/assistant-conversation-history";
import { AssistantSessionSummary } from "@/features/assistant/components/assistant-session-summary";
import { AssistantUsageMeter } from "@/features/assistant/components/assistant-usage-meter";
import { WorkspaceAssistantSettingsPanel } from "@/features/workspaces/components/assistant-settings-panel";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ASSISTANT_SUGGESTIONS,
  useAssistantChat,
} from "@/features/assistant/context/assistant-chat-context";
import { canManageAssistantSettings } from "@/lib/permissions";
import type { WorkspaceRole } from "@/types/workspace";
import type { AssistantConversationMessage } from "@/types/assistant-conversation";
import type {
  AssistantChatEvent,
  AssistantChatResponse,
  ChatAttachment,
  ChatMessage,
  ChatTranscriptMessage,
  ConfirmedActionSummary,
  PendingActionLocalStatus,
} from "@/features/assistant/types";

const MAX_MESSAGE_LENGTH = 2000;
// The API accepts at most 50 history entries per turn (API.md § 16) and
// windows them further on its side — a long resumed conversation sends only
// its latest turns.
const MAX_HISTORY_MESSAGES = 50;

// A saved conversation back into transcript form. Proposed actions come back
// display-only (`pastActions`): whether they were confirmed isn't saved, and
// the action itself has long expired.
function toTranscript(messages: AssistantConversationMessage[]): ChatTranscriptMessage[] {
  return messages.map((message) => {
    const transcribed = new Set(message.metadata?.transcriptions?.map((t) => t.fileName));
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      attachments: message.metadata?.attachments?.map((fileName) => ({
        fileName,
        isAudio: transcribed.has(fileName),
      })),
      executedActions: message.metadata?.executedActions?.map((action) => ({
        tool: action.tool,
        result: null,
      })),
      pastActions: message.metadata?.pendingActions,
    };
  });
}

// Attachments from earlier turns are never resent (API.md § 16) — only this
// short filename note survives into `history`, matching the backend's own
// suggested convention (`[anexo: relatorio.pdf]`). Audio isn't noted this
// way since its transcription is already folded into `content`.
function toHistoryContent(message: ChatTranscriptMessage): string {
  const fileNotes = (message.attachments ?? [])
    .filter((attachment) => !attachment.isAudio)
    .map((attachment) => `[anexo: ${attachment.fileName}]`);
  return [message.content, ...fileNotes].filter(Boolean).join("\n");
}

interface ChatState {
  transcript: ChatTranscriptMessage[];
  confirmedActions: ConfirmedActionSummary[];
}

const INITIAL_STATE: ChatState = { transcript: [], confirmedActions: [] };

type ChatAction =
  | { type: "add"; message: ChatTranscriptMessage }
  | { type: "set-content"; messageId: string; content: string }
  | { type: "stream-event"; messageId: string; event: AssistantChatEvent }
  | { type: "stream-done"; messageId: string; result: AssistantChatResponse }
  | { type: "stream-failed"; messageId: string }
  | { type: "set-pending-status"; messageId: string; actionId: string; status: PendingActionLocalStatus }
  | { type: "load"; transcript: ChatTranscriptMessage[] }
  | { type: "reset" };

function updateMessage(
  state: ChatState,
  messageId: string,
  update: (message: ChatTranscriptMessage) => ChatTranscriptMessage
): ChatState {
  return {
    ...state,
    transcript: state.transcript.map((message) =>
      message.id === messageId ? update(message) : message
    ),
  };
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "add":
      return { ...state, transcript: [...state.transcript, action.message] };
    case "set-content":
      return updateMessage(state, action.messageId, (message) => ({
        ...message,
        content: action.content,
      }));
    case "stream-event": {
      const { event } = action;
      if (event.type === "status") {
        return updateMessage(state, action.messageId, (message) => ({
          ...message,
          streamingStatus: { stage: event.stage, tool: event.tool },
        }));
      }
      if (event.type === "text_delta") {
        return updateMessage(state, action.messageId, (message) => ({
          ...message,
          content: message.content + event.delta,
        }));
      }
      if (event.type === "pending_action") {
        // Shown as soon as it's registered — the user may confirm it before
        // the reply even finishes.
        return updateMessage(state, action.messageId, (message) => ({
          ...message,
          pendingActions: message.pendingActions?.some((p) => p.id === event.action.id)
            ? message.pendingActions
            : [...(message.pendingActions ?? []), { ...event.action, status: "pending" }],
        }));
      }
      // `transcription` is handled by the caller (it updates the *user*
      // bubble); `warning` needs nothing here — the final `reply` already
      // opens with the same notice.
      return state;
    }
    case "stream-done":
      // `reply` is authoritative: it replaces whatever the deltas built up
      // (an intermediate round's text never makes it into `reply`). Pending
      // actions keep any status the user already gave them mid-stream.
      return updateMessage(state, action.messageId, (message) => {
        const known = new Map(message.pendingActions?.map((p) => [p.id, p.status]));
        return {
          ...message,
          content: action.result.reply,
          executedActions: action.result.executedActions,
          pendingActions: action.result.pendingActions.map((pendingAction) => ({
            ...pendingAction,
            status: known.get(pendingAction.id) ?? "pending",
          })),
          streamingStatus: undefined,
        };
      });
    case "stream-failed": {
      // A pending action registered before the failure is still valid until
      // its TTL (API.md § 16), so its bubble stays; an empty one goes away.
      const message = state.transcript.find((m) => m.id === action.messageId);
      if (!message?.pendingActions?.length) {
        return {
          ...state,
          transcript: state.transcript.filter((m) => m.id !== action.messageId),
        };
      }
      return updateMessage(state, action.messageId, (m) => ({ ...m, streamingStatus: undefined }));
    }
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
    case "load":
      return { ...INITIAL_STATE, transcript: action.transcript };
    case "reset":
      return INITIAL_STATE;
  }
}

// `AssistantChat` never unmounts (rendered unconditionally by the topbar;
// its open state lives in AssistantChatProvider so the sidebar, home and
// Assistente page can open it too), so closing the Sheet keeps the current
// conversation — reopening picks it up where it was. Every turn is also saved
// server-side (API.md § 16), so "Nova conversa" and switching workspace start
// fresh without losing anything: older chats are one click away in the
// history view.
export function AssistantChat() {
  const { open, setOpen, draft } = useAssistantChat();
  const [showSummary, setShowSummary] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  // Saved conversation the current transcript belongs to — `null` until the
  // first reply of a new one comes back with its id.
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  // The AI provider refused the call for lack of credits/quota: retrying is
  // pointless, so the composer stays locked until the sheet is reopened.
  const [creditsExhausted, setCreditsExhausted] = React.useState(false);
  // TOKEN_QUOTA_EXCEEDED: the plan's cap for the day, week or month was hit
  // (API.md § 23 doesn't say which). Unlike the credits case it clears on its
  // own when the window resets, so the composer stays usable.
  const [quotaExceeded, setQuotaExceeded] = React.useState(false);
  const { workspace } = useCurrentWorkspace();
  const { userId } = useAuth();
  const myRole = workspace?.members.find((m) => m.userId === userId)?.role as
    | WorkspaceRole
    | undefined;
  const [text, setText] = React.useState("");
  // A suggestion picked elsewhere pre-fills the composer — applied while
  // rendering (not in an effect) so it is there the moment the Sheet opens.
  const [appliedDraftKey, setAppliedDraftKey] = React.useState<number | null>(null);
  if (draft && draft.key !== appliedDraftKey) {
    setAppliedDraftKey(draft.key);
    setText(draft.text.slice(0, MAX_MESSAGE_LENGTH));
  }
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  // Wider panel for long answers and tables; per-session, not persisted.
  const [expanded, setExpanded] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [state, dispatch] = React.useReducer(chatReducer, INITIAL_STATE);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const streamAbortRef = React.useRef<AbortController | null>(null);

  const sendMutation = useSendChatMessageMutation(workspace?.id ?? "");
  const loadMutation = useLoadAssistantConversationMutation();
  const assistantEnabled = workspace?.assistantEnabled ?? false;
  const composerDisabled = sendMutation.isPending || !assistantEnabled || creditsExhausted;

  // Tokens spent in the current quota day (since 00:00 UTC, every feature —
  // content-safety checks on chat messages count too), the same total
  // TOKEN_QUOTA_GUARD's daily cap checks (API.md § 23). No endpoint exposes
  // the user's plan/token cap (`GET /auth/me` never returns a planId — see
  // plan-picker.tsx), so there's no "100%" to show; the meter below scales
  // itself instead. Enabled only while the sheet is open, and refetched right
  // after each reply (the stream carries no token counts) so it tracks the
  // running total.
  const usageQuery = useQuotaWindowUsageQuery("day", { enabled: open && assistantEnabled });
  const tokensToday = usageQuery.data ?? null;

  // Read inside the recorder's `onstop` handler, which closes over whatever
  // `files`/`sendMessage` existed when recording *started* — these refs give
  // it the latest values instead, since the composer can change while a
  // recording is in progress (attach a file, type text) and the "stop mic →
  // send" step should still use whatever is current at that moment.
  const filesRef = React.useRef<File[]>(files);
  const sendMessageRef = React.useRef<(filesToSend: File[]) => void>(() => {});

  // Recording finishing is itself the send trigger (voice-message style: stop
  // the mic and it's on its way) — no separate "click Send" step for audio.
  const recorder = useAudioRecorder((file) => {
    const { accepted, error } = validateNewFiles(filesRef.current, [file]);
    if (error) {
      toast.error(error);
      return;
    }
    sendMessageRef.current([...filesRef.current, ...accepted]);
  });

  React.useEffect(() => {
    if (recorder.status === "unsupported") {
      toast.error("Este navegador não suporta gravação de áudio.");
    } else if (recorder.status === "denied") {
      toast.error("Não foi possível acessar o microfone. Verifique a permissão do navegador.");
    }
  }, [recorder.status]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [state.transcript, sendMutation.isPending]);

  function resetConversation() {
    // Closing the connection also stops the model server-side, so no
    // tokens are spent on a reply nobody will read.
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setShowSummary(false);
    setCreditsExhausted(false);
    setQuotaExceeded(false);
    setFiles([]);
    if (recorder.status === "recording") recorder.cancel();
    setConversationId(null);
    dispatch({ type: "reset" });
  }

  // A conversation belongs to one workspace — switching starts a new one
  // (applied while rendering, same as the draft above).
  const [conversationWorkspaceId, setConversationWorkspaceId] = React.useState(workspace?.id);
  if (workspace?.id !== conversationWorkspaceId) {
    setConversationWorkspaceId(workspace?.id);
    setConversationId(null);
    setShowHistory(false);
    dispatch({ type: "reset" });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) return;
    // The transcript stays for the next open, but nothing keeps running in
    // the background: closing the connection also stops the model
    // server-side (that half-finished turn isn't saved).
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    if (recorder.status === "recording") recorder.cancel();
    setShowHistory(false);
    setCreditsExhausted(false);
    if (showSummary) {
      // "Encerrar e revisar" ends the conversation.
      resetConversation();
      setText("");
    }
  }

  function handleSelectConversation(id: string) {
    if (id === conversationId) {
      setShowHistory(false);
      return;
    }
    loadMutation.mutate(id, {
      onSuccess: (messages) => {
        resetConversation();
        dispatch({ type: "load", transcript: toTranscript(messages) });
        setConversationId(id);
        setShowHistory(false);
      },
    });
  }

  function handleConversationDeleted(id: string) {
    if (id === conversationId) resetConversation();
  }

  function handleNewConversation() {
    resetConversation();
    setText("");
    inputRef.current?.focus();
  }

  // Enter sends, Shift+Enter breaks the line — the usual chat convention.
  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (recorder.status === "recording") return;
    sendMessage(files);
  }

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;

    const { accepted, error } = validateNewFiles(files, selected);
    if (error) {
      toast.error(error);
      return;
    }
    setFiles((previous) => [...previous, ...accepted]);
  }

  function removeFile(index: number) {
    setFiles((previous) => previous.filter((_, i) => i !== index));
  }

  const hasAudio = files.some(isAudioFile);

  function sendMessage(filesToSend: File[]) {
    const trimmed = text.trim();
    const canSubmit = trimmed.length > 0 || filesToSend.some(isAudioFile);
    if (!canSubmit || composerDisabled || !workspace) return;

    // Turns that ended up empty (e.g. a failed audio-only turn) are left out
    // — the API rejects a history entry with no content.
    const history: ChatMessage[] = state.transcript
      .map((message) => ({ role: message.role, content: toHistoryContent(message) }))
      .filter((message) => message.content)
      .slice(-MAX_HISTORY_MESSAGES);

    const attachments: ChatAttachment[] = filesToSend.map((file) => ({
      fileName: file.name,
      isAudio: isAudioFile(file),
    }));
    const messageId = crypto.randomUUID();
    const replyId = crypto.randomUUID();
    // Audio-only turns leave the optimistic bubble empty — filled in with
    // what the backend understood as each transcription arrives.
    const transcribed: string[] = [];

    dispatch({
      type: "add",
      message: { id: messageId, role: "user", content: trimmed, attachments },
    });
    // The reply bubble exists from the start so the user watches the
    // assistant work (status, then text token by token) instead of a spinner.
    dispatch({
      type: "add",
      message: { id: replyId, role: "assistant", content: "", pendingActions: [], streamingStatus: null },
    });
    setText("");
    setFiles([]);

    const abort = new AbortController();
    streamAbortRef.current = abort;

    sendMutation.mutate(
      {
        message: trimmed,
        history,
        conversationId,
        files: filesToSend.length > 0 ? filesToSend : undefined,
        signal: abort.signal,
        onEvent: (event) => {
          if (event.type === "transcription") {
            if (trimmed) return;
            transcribed.push(event.transcription.text);
            dispatch({ type: "set-content", messageId, content: transcribed.join("\n") });
            return;
          }
          dispatch({ type: "stream-event", messageId: replyId, event });
        },
      },
      {
        onSuccess: (data) => {
          setQuotaExceeded(false);
          if (data.conversationId) setConversationId(data.conversationId);
          if (!trimmed && data.transcriptions.length > 0) {
            dispatch({
              type: "set-content",
              messageId,
              content: data.transcriptions.map((transcription) => transcription.text).join("\n"),
            });
          }
          dispatch({ type: "stream-done", messageId: replyId, result: data });
          usageQuery.refetch();
        },
        onError: (error) => {
          dispatch({ type: "stream-failed", messageId: replyId });
          if (getErrorCode(error) === "AI_INSUFFICIENT_CREDITS") setCreditsExhausted(true);
          if (getErrorCode(error) === "TOKEN_QUOTA_EXCEEDED") setQuotaExceeded(true);
          // Deleted meanwhile (e.g. in another tab): the next send starts a new one.
          if (getErrorCode(error) === "ASSISTANT_CONVERSATION_NOT_FOUND") setConversationId(null);
        },
        onSettled: () => {
          if (streamAbortRef.current === abort) streamAbortRef.current = null;
        },
      }
    );
  }
  // Refs are written after render, not during it (react-hooks/refs); a layout
  // effect still lands before any recorder `onstop` event can read them.
  React.useLayoutEffect(() => {
    filesRef.current = files;
    sendMessageRef.current = sendMessage;
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (recorder.status === "recording") return;
    sendMessage(files);
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
          aria-label="Conversar com o assistente de IA"
          title="Conversar com o assistente de IA (Ctrl J)"
          data-tour="assistant"
          className="gap-2 bg-linear-to-r from-primary to-primary/75 shadow-sm shadow-primary/30 max-sm:size-8 max-sm:px-0"
        >
          <Sparkles />
          <span className="hidden sm:inline">Perguntar à IA</span>
          <kbd className="hidden rounded bg-primary-foreground/15 px-1.5 font-mono text-[10px] lg:inline">
            Ctrl J
          </kbd>
        </Button>
      </SheetTrigger>
      <SheetContent
        className={cn(
          // Same `data-[side=right]:` variant as SheetContent's defaults (w-3/4,
          // sm:max-w-sm) so cn() replaces them — a plain `sm:max-w-*` loses
          // to the attribute selector's higher specificity.
          "flex flex-col gap-0 transition-[max-width] duration-200 data-[side=right]:w-full",
          expanded ? "data-[side=right]:sm:max-w-3xl" : "data-[side=right]:sm:max-w-lg"
        )}
        onOpenAutoFocus={(event) => {
          // Straight to typing instead of the close button.
          if (!inputRef.current || inputRef.current.disabled) return;
          event.preventDefault();
          inputRef.current.focus();
        }}
      >
        <SheetHeader className="gap-3 border-b border-border/60 pr-12">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-sm shadow-primary/30">
              <Sparkles className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle>Assistente de IA</SheetTitle>
              <SheetDescription className="truncate text-xs">
                {workspace ? `Trabalhando em ${workspace.name}` : "Nenhum workspace selecionado"}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-0.5">
              {assistantEnabled && workspace ? (
                <Button
                  variant={showHistory ? "secondary" : "ghost"}
                  size="icon-sm"
                  aria-label="Conversas anteriores"
                  title="Conversas anteriores"
                  aria-pressed={showHistory}
                  onClick={() => setShowHistory((current) => !current)}
                >
                  <History />
                </Button>
              ) : null}
              {state.transcript.length > 0 ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Nova conversa"
                  title="Nova conversa"
                  onClick={() => {
                    setShowHistory(false);
                    handleNewConversation();
                  }}
                >
                  <SquarePen />
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden sm:inline-flex"
                aria-label={expanded ? "Diminuir painel" : "Ampliar painel"}
                title={expanded ? "Diminuir painel" : "Ampliar painel"}
                onClick={() => setExpanded((current) => !current)}
              >
                {expanded ? <Minimize2 /> : <Maximize2 />}
              </Button>
            </div>
          </div>
          {assistantEnabled && workspace ? (
            <AssistantUsageMeter tokensToday={tokensToday} isUpdating={sendMutation.isPending} />
          ) : null}
        </SheetHeader>

        {/* Only once something was actually confirmed — an always-visible
            "0 ações" row was noise in an empty chat. */}
        {confirmedCount > 0 && !showSummary && !showHistory ? (
          <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-success/5 px-4 py-2">
            <span className="flex items-center gap-1.5 text-xs text-foreground">
              <CircleCheck className="size-3.5 text-success" />
              {confirmedCount === 1
                ? "1 ação confirmada nesta conversa"
                : `${confirmedCount} ações confirmadas nesta conversa`}
            </span>
            <Button size="xs" variant="outline" onClick={() => setShowSummary(true)}>
              Encerrar e revisar
            </Button>
          </div>
        ) : null}

        {showSummary ? (
          <AssistantSessionSummary
            confirmedActions={state.confirmedActions}
            onClose={() => handleOpenChange(false)}
          />
        ) : showHistory && workspace ? (
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">Conversas anteriores</p>
              <Button size="xs" variant="ghost" onClick={() => setShowHistory(false)}>
                <ArrowLeft />
                Voltar
              </Button>
            </div>
            <AssistantConversationHistory
              workspaceId={workspace.id}
              activeConversationId={conversationId}
              loadingConversationId={loadMutation.isPending ? (loadMutation.variables ?? null) : null}
              onSelect={handleSelectConversation}
              onDeleted={handleConversationDeleted}
            />
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-4">
              {!workspace ? null : !assistantEnabled ? (
                <div className="rounded-lg border border-border/60 p-4">
                  <WorkspaceAssistantSettingsPanel
                    workspace={workspace}
                    canManage={canManageAssistantSettings(myRole)}
                  />
                </div>
              ) : state.transcript.length === 0 ? (
                <div className="space-y-4 py-2">
                  <div className="space-y-2 text-center">
                    <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="size-6" />
                    </span>
                    <p className="font-medium text-foreground">Como posso ajudar?</p>
                    <p className="text-sm text-muted-foreground">
                      Escreva, grave um áudio ou envie um arquivo. Eu consulto e organizo pastas e
                      itens para você — toda alteração pede sua confirmação antes de acontecer.
                    </p>
                  </div>
                  <div className={cn("grid gap-2", expanded && "sm:grid-cols-2")}>
                    {ASSISTANT_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="rounded-lg border border-border/60 px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                        onClick={() => {
                          setText(suggestion);
                          inputRef.current?.focus();
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
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
              {creditsExhausted ? (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {getMessageForCode("AI_INSUFFICIENT_CREDITS")}
                </p>
              ) : null}
              {quotaExceeded && !creditsExhausted ? (
                <div
                  role="alert"
                  className="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-foreground"
                >
                  <p>{getMessageForCode("TOKEN_QUOTA_EXCEEDED")}</p>
                  <Link
                    href="/settings/plan"
                    onClick={() => handleOpenChange(false)}
                    className="font-medium text-primary hover:underline"
                  >
                    Ver consumo e planos
                  </Link>
                </div>
              ) : null}
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-2 border-t border-border/60 p-3 sm:p-4"
            >
              {files.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {files.map((file, index) => (
                    <span
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted px-2.5 py-1 text-xs text-foreground"
                    >
                      {isAudioFile(file) ? (
                        <Mic className="size-3 text-muted-foreground" />
                      ) : (
                        <Paperclip className="size-3 text-muted-foreground" />
                      )}
                      <span className="max-w-35 truncate">{file.name}</span>
                      <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                      <button
                        type="button"
                        aria-label={`Remover ${file.name}`}
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => removeFile(index)}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              {recorder.status === "recording" ? (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <span className="size-2 animate-pulse rounded-full bg-destructive" />
                  Gravando... {String(Math.floor(recorder.seconds / 60)).padStart(2, "0")}:
                  {String(recorder.seconds % 60).padStart(2, "0")} — pare para enviar
                </p>
              ) : files.length > 0 && !hasAudio && !text.trim() ? (
                <p className="text-xs text-muted-foreground">
                  Escreva uma mensagem para enviar junto com o(s) arquivo(s).
                </p>
              ) : files.some((file) => !isAudioFile(file)) ? (
                // The server only reads a file's content when the message asks
                // for it; otherwise it is kept (30 min) to attach to an item.
                <p className="text-xs text-muted-foreground">
                  Peça para ler, resumir ou extrair algo do arquivo, ou diga em que item anexá-lo.
                </p>
              ) : null}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
              />
              {/* One field, chat-app style: text on top, tools and send below. */}
              <div
                className={cn(
                  "rounded-2xl border border-input bg-background shadow-xs transition-colors focus-within:border-primary/50 focus-within:ring-3 focus-within:ring-primary/15 dark:bg-input/30",
                  composerDisabled && "opacity-60"
                )}
              >
                <textarea
                  ref={inputRef}
                  value={text}
                  rows={1}
                  onChange={(event) => setText(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                  onKeyDown={handleComposerKeyDown}
                  maxLength={MAX_MESSAGE_LENGTH}
                  placeholder="Pergunte ou peça algo..."
                  aria-label="Mensagem para o assistente"
                  disabled={composerDisabled}
                  className="field-sizing-content block max-h-40 min-h-11 w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm"
                />
                <div className="flex items-center gap-1 px-2 pb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Anexar arquivo"
                    title="Anexar arquivo"
                    className="text-muted-foreground"
                    disabled={composerDisabled || recorder.status === "recording"}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip />
                  </Button>
                  <Button
                    type="button"
                    variant={recorder.status === "recording" ? "destructive" : "ghost"}
                    size="icon-sm"
                    aria-label={recorder.status === "recording" ? "Parar gravação" : "Gravar áudio"}
                    title={recorder.status === "recording" ? "Parar e enviar" : "Gravar áudio"}
                    className={cn(recorder.status !== "recording" && "text-muted-foreground")}
                    disabled={composerDisabled}
                    onClick={() => (recorder.status === "recording" ? recorder.stop() : recorder.start())}
                  >
                    {recorder.status === "recording" ? <Square /> : <Mic />}
                  </Button>
                  <span className="ml-auto pr-1 text-[11px] text-muted-foreground">
                    {text.length > MAX_MESSAGE_LENGTH * 0.8
                      ? `${text.length}/${MAX_MESSAGE_LENGTH}`
                      : null}
                  </span>
                  <Button
                    type="submit"
                    size="icon-sm"
                    aria-label="Enviar"
                    className="rounded-full"
                    disabled={
                      composerDisabled ||
                      recorder.status === "recording" ||
                      (!text.trim() && !hasAudio)
                    }
                  >
                    {sendMutation.isPending ? <Loader2 className="animate-spin" /> : <ArrowUp />}
                  </Button>
                </div>
              </div>
              <p className="hidden text-center text-[11px] text-muted-foreground sm:block">
                Enter envia · Shift + Enter quebra a linha · a IA pode errar, confira antes de
                confirmar
              </p>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
