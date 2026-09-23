"use client";

import * as React from "react";
import { Loader2, Mic, Paperclip, Send, Sparkles, Square, X } from "lucide-react";
import { toast } from "sonner";
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
import { formatFileSize } from "@/lib/format";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useMyAiUsageQuery, useSendChatMessageMutation } from "@/features/assistant/hooks/use-assistant";
import { useAudioRecorder } from "@/features/assistant/hooks/use-audio-recorder";
import { isAudioFile, validateNewFiles } from "@/features/assistant/lib/attachment-limits";
import { AssistantMessage } from "@/features/assistant/components/assistant-message";
import { AssistantSessionSummary } from "@/features/assistant/components/assistant-session-summary";
import { AssistantUsageMeter } from "@/features/assistant/components/assistant-usage-meter";
import { TypingIndicator } from "@/features/assistant/components/typing-indicator";
import type {
  ChatAttachment,
  ChatMessage,
  ChatTranscriptMessage,
  ConfirmedActionSummary,
  PendingActionLocalStatus,
} from "@/features/assistant/types";

const MAX_MESSAGE_LENGTH = 2000;

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
  | { type: "set-pending-status"; messageId: string; actionId: string; status: PendingActionLocalStatus }
  | { type: "reset" };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "add":
      return { ...state, transcript: [...state.transcript, action.message] };
    case "set-content":
      return {
        ...state,
        transcript: state.transcript.map((message) =>
          message.id === action.messageId ? { ...message, content: action.content } : message
        ),
      };
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
  const [files, setFiles] = React.useState<File[]>([]);
  const [state, dispatch] = React.useReducer(chatReducer, INITIAL_STATE);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const sendMutation = useSendChatMessageMutation(workspace?.id ?? "");
  const assistantEnabled = workspace?.assistantEnabled ?? false;
  const composerDisabled = sendMutation.isPending || !assistantEnabled || creditsExhausted;

  // Today's assistant-chat token usage (real number from `/ai-usage/me`,
  // already used by the usage history screen). No endpoint exposes the
  // user's plan/token cap or a real quota reset time (`GET /auth/me` never
  // returns a planId — see plan-picker.tsx), so there's no "100%" to show;
  // the meter below scales itself instead. Enabled only while the sheet is
  // open, and refetched right after each reply so it tracks the running
  // total as closely as this non-streaming API allows.
  const usageQuery = useMyAiUsageQuery(
    { days: 1, feature: "assistant-chat", page: 1 },
    { enabled: open && assistantEnabled }
  );
  const tokensToday = usageQuery.data?.summary.totalTokens ?? null;

  // Read inside the recorder's `onstop` handler, which closes over whatever
  // `files`/`sendMessage` existed when recording *started* — these refs give
  // it the latest values instead, since the composer can change while a
  // recording is in progress (attach a file, type text) and the "stop mic →
  // send" step should still use whatever is current at that moment.
  const filesRef = React.useRef<File[]>(files);
  filesRef.current = files;
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

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setShowSummary(false);
      setCreditsExhausted(false);
      setFiles([]);
      if (recorder.status === "recording") recorder.cancel();
      dispatch({ type: "reset" });
    }
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

    const history: ChatMessage[] = state.transcript.map((message) => ({
      role: message.role,
      content: toHistoryContent(message),
    }));

    const attachments: ChatAttachment[] = filesToSend.map((file) => ({
      fileName: file.name,
      isAudio: isAudioFile(file),
    }));
    const messageId = crypto.randomUUID();

    dispatch({
      type: "add",
      message: { id: messageId, role: "user", content: trimmed, attachments },
    });
    setText("");
    setFiles([]);

    sendMutation.mutate(
      { message: trimmed, history, files: filesToSend.length > 0 ? filesToSend : undefined },
      {
        onSuccess: (data) => {
          // Audio-only turns leave the optimistic bubble empty — fill it in
          // with what the backend actually understood once we know it.
          if (!trimmed && data.transcriptions.length > 0) {
            dispatch({
              type: "set-content",
              messageId,
              content: data.transcriptions.map((transcription) => transcription.text).join("\n"),
            });
          }
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
          usageQuery.refetch();
        },
        onError: (error) => {
          if (getErrorCode(error) === "AI_INSUFFICIENT_CREDITS") setCreditsExhausted(true);
        },
      }
    );
  }
  sendMessageRef.current = sendMessage;

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
          {assistantEnabled && workspace ? (
            <AssistantUsageMeter tokensToday={tokensToday} isUpdating={sendMutation.isPending} />
          ) : null}
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
              {sendMutation.isPending ? <TypingIndicator /> : null}
              {creditsExhausted ? (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {getMessageForCode("AI_INSUFFICIENT_CREDITS")}
                </p>
              ) : null}
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-2 border-t border-border/60 p-4"
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
              ) : null}

              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelected}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Anexar arquivo"
                  disabled={composerDisabled || recorder.status === "recording"}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip />
                </Button>
                <Button
                  type="button"
                  variant={recorder.status === "recording" ? "destructive" : "outline"}
                  size="icon"
                  aria-label={recorder.status === "recording" ? "Parar gravação" : "Gravar áudio"}
                  disabled={composerDisabled}
                  onClick={() => (recorder.status === "recording" ? recorder.stop() : recorder.start())}
                >
                  {recorder.status === "recording" ? <Square /> : <Mic />}
                </Button>
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
                  disabled={
                    composerDisabled ||
                    recorder.status === "recording" ||
                    (!text.trim() && !hasAudio)
                  }
                >
                  {sendMutation.isPending ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
              </div>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
