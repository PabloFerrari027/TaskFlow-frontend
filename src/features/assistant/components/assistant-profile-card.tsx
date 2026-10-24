"use client";

import * as React from "react";
import { Pencil, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useAssistantProfileQuery,
  useUpdateAssistantProfileMutation,
} from "@/features/assistant/hooks/use-assistant";
import { getErrorMessage } from "@/lib/errors";
import { formatRelativeTime } from "@/lib/format";

// Same cap as the API (API.md § 16) — the summary goes into every prompt.
const PROFILE_SUMMARY_MAX_LENGTH = 2000;

/**
 * What the assistant knows about the user: a short summary it writes itself
 * from what they told it (mostly in the first conversation) and uses in every
 * chat, here and on WhatsApp. The user can read, fix or erase it.
 */
export function AssistantProfileCard() {
  const profileQuery = useAssistantProfileQuery();
  const updateMutation = useUpdateAssistantProfileMutation();
  const [draft, setDraft] = React.useState<string | null>(null);
  const profile = profileQuery.data;

  if (profileQuery.isPending) {
    return (
      <Card className="space-y-2 p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  }

  if (profileQuery.isError) {
    return (
      <Card className="p-4">
        <p className="text-sm text-destructive">{getErrorMessage(profileQuery.error)}</p>
      </Card>
    );
  }

  const editing = draft !== null;

  function save() {
    if (draft === null) return;
    updateMutation.mutate(draft.trim() || null, { onSuccess: () => setDraft(null) });
  }

  return (
    <Card className="space-y-3 p-4">
      {editing ? (
        <>
          <Textarea
            value={draft}
            maxLength={PROFILE_SUMMARY_MAX_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="O que o assistente sabe sobre você"
            placeholder="Ex.: Tenho uma confeitaria e quero organizar as encomendas da semana."
            className="min-h-24"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)} disabled={updateMutation.isPending}>
              Cancelar
            </Button>
            <Button size="sm" onClick={save} loading={updateMutation.isPending} disabled={updateMutation.isPending}>
              Salvar
            </Button>
          </div>
        </>
      ) : profile?.summary ? (
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm whitespace-pre-line text-foreground">{profile.summary}</p>
            {profile.updatedAt ? (
              <p className="text-xs text-muted-foreground">Atualizado {formatRelativeTime(profile.updatedAt)}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Corrigir"
              title="Corrigir"
              onClick={() => setDraft(profile.summary ?? "")}
            >
              <Pencil />
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label="Apagar" title="Apagar" className="hover:text-destructive">
                  <Trash2 />
                </Button>
              }
              title="Apagar o que o assistente sabe sobre você?"
              description="Ele deixa de usar essas informações nas conversas, aqui e no WhatsApp. Suas pastas, itens e mensagens não mudam."
              confirmLabel="Apagar"
              isLoading={updateMutation.isPending}
              onConfirm={() => updateMutation.mutate(null)}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            O assistente ainda não sabe nada sobre você. Conte no chat o que você faz e o que quer
            organizar — ou escreva aqui.
          </p>
          <Button size="sm" variant="outline" onClick={() => setDraft("")}>
            Escrever
          </Button>
        </div>
      )}
    </Card>
  );
}
