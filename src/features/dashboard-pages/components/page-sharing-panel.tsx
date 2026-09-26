"use client";

import * as React from "react";
import { AlertTriangle, Check, Copy, Link2, Loader2, Mail, RefreshCw, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { InlinePicker } from "@/features/automations/components/inline-fields";
import type { AutomationLookups } from "@/features/automations/hooks/use-automation-lookups";
import {
  useAccessGrantsQuery,
  useCreateAccessGrantMutation,
  useDashboardPagesQuery,
  useRegeneratePublicTokenMutation,
  useRevokeAccessGrantMutation,
  useUpdateDashboardPageMutation,
} from "@/features/dashboard-pages/hooks/use-dashboard-pages";
import {
  PUBLIC_REQUIRES_MANAGER_HINT,
  VISIBILITY_SPECS,
  publicPageUrl,
  visibilitySpec,
} from "@/features/dashboard-pages/lib/visibility";
import { useWorkspaceQuery } from "@/features/workspaces/hooks/use-workspaces";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate } from "@/lib/format";
import { canPublishDashboardPage } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { AuthenticatedDashboardPageView, DashboardPageVisibility } from "@/types/dashboard-page";

const emailSchema = z.email();

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function VisibilitySection({
  workspaceId,
  page,
  hasActivePublicLink,
}: {
  workspaceId: string;
  page: AuthenticatedDashboardPageView;
  hasActivePublicLink: boolean;
}) {
  const { userId } = useAuth();
  const workspaceQuery = useWorkspaceQuery(workspaceId);
  const myRole = workspaceQuery.data?.members.find((m) => m.userId === userId)?.role;
  // Who may turn a page PUBLIC is a workspace-role rule (the backend enforces
  // it too) — this only decides whether the option is offered.
  const canMakePublic = canPublishDashboardPage(myRole);
  const updateMutation = useUpdateDashboardPageMutation(workspaceId, page.id);
  const [pendingLeave, setPendingLeave] = React.useState<DashboardPageVisibility | null>(null);

  function choose(visibility: DashboardPageVisibility) {
    if (visibility === page.visibility || updateMutation.isPending) return;
    // Leaving PUBLIC revokes the link on the backend — say so first.
    if (page.visibility === "PUBLIC" && hasActivePublicLink) {
      setPendingLeave(visibility);
      return;
    }
    updateMutation.mutate({ visibility });
  }

  return (
    <Section title="Quem pode ver">
      <div role="radiogroup" aria-label="Quem pode ver" className="space-y-2">
        {VISIBILITY_SPECS.map((spec) => {
          const selected = page.visibility === spec.value;
          const locked = spec.value === "PUBLIC" && !canMakePublic && !selected;
          const option = (
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={locked || undefined}
              disabled={locked}
              onClick={() => choose(spec.value)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                locked && "cursor-not-allowed opacity-50 hover:bg-transparent"
              )}
            >
              <spec.icon className={cn("mt-0.5 size-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{spec.label}</span>
                <span className="block text-xs text-muted-foreground">{spec.description}</span>
              </span>
              {selected ? (
                updateMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <Check className="size-4 text-primary" />
                )
              ) : null}
            </button>
          );

          // A disabled button fires no pointer events, so the tooltip hangs
          // off a wrapper instead.
          return locked ? (
            <Tooltip key={spec.value}>
              <TooltipTrigger asChild>
                <span className="block" tabIndex={0}>
                  {option}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{PUBLIC_REQUIRES_MANAGER_HINT}</TooltipContent>
            </Tooltip>
          ) : (
            <React.Fragment key={spec.value}>{option}</React.Fragment>
          );
        })}
      </div>

      <ConfirmDialog
        trigger={<span hidden />}
        open={pendingLeave !== null}
        onOpenChange={(open) => !open && setPendingLeave(null)}
        title="Desativar o link público?"
        description={`A página passa a ser "${pendingLeave ? visibilitySpec(pendingLeave).label : ""}" e o link público atual para de funcionar imediatamente. Se voltar a deixá-la pública, será preciso gerar um link novo.`}
        confirmLabel="Desativar link"
        isLoading={updateMutation.isPending}
        onConfirm={() => {
          if (!pendingLeave) return;
          updateMutation.mutate({ visibility: pendingLeave }, { onSettled: () => setPendingLeave(null) });
        }}
      />
    </Section>
  );
}

function AccessListSection({
  workspaceId,
  pageId,
  lookups,
}: {
  workspaceId: string;
  pageId: string;
  lookups: AutomationLookups;
}) {
  const grantsQuery = useAccessGrantsQuery(workspaceId, pageId, true);
  const createMutation = useCreateAccessGrantMutation(workspaceId, pageId);
  const revokeMutation = useRevokeAccessGrantMutation(workspaceId, pageId);
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [revoking, setRevoking] = React.useState<{ id: string; label: string } | null>(null);

  const grants = grantsQuery.data ?? [];
  const grantedUserIds = new Set(grants.map((grant) => grant.userId).filter(Boolean));
  const memberOptions = (lookups.optionsFor("member") ?? []).filter(
    (option) => !grantedUserIds.has(option.value)
  );

  function addEmail(event: React.FormEvent) {
    event.preventDefault();
    const value = email.trim();
    if (!emailSchema.safeParse(value).success) {
      setEmailError("Digite um e-mail válido, como nome@empresa.com.");
      return;
    }
    setEmailError(null);
    createMutation.mutate({ email: value }, { onSuccess: () => setEmail("") });
  }

  return (
    <Section title="Pessoas com acesso">
      <div className="space-y-3 rounded-lg border border-border p-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Membro do workspace</p>
          <div className="flex items-center gap-2">
            <UserPlus className="size-4 text-muted-foreground" />
            <InlinePicker
              value=""
              options={memberOptions}
              placeholder={memberOptions.length ? "escolher membro" : "todos os membros já têm acesso"}
              emptyText="Nenhum membro encontrado."
              ariaLabel="Adicionar membro"
              onChange={(userId) => createMutation.mutate({ userId })}
            />
          </div>
        </div>

        <form className="space-y-1.5" onSubmit={addEmail} noValidate>
          <Label htmlFor="grant-email" className="text-xs font-medium text-muted-foreground">
            Pessoa de fora (por e-mail)
          </Label>
          <div className="flex gap-2">
            <Input
              id="grant-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="nome@empresa.com"
              value={email}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? "grant-email-error" : "grant-email-hint"}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setEmailError(null);
              }}
            />
            <Button type="submit" variant="outline" disabled={!email.trim() || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="animate-spin" /> : <Mail />}
              Enviar
            </Button>
          </div>
          {emailError ? (
            <p id="grant-email-error" className="text-xs text-destructive">
              {emailError}
            </p>
          ) : (
            <p id="grant-email-hint" className="text-xs text-muted-foreground">
              A pessoa recebe um link pessoal por e-mail e vê a página sem precisar de conta.
            </p>
          )}
        </form>
      </div>

      {grantsQuery.isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : grantsQuery.isError ? (
        <ErrorState error={grantsQuery.error} onRetry={() => grantsQuery.refetch()} />
      ) : grants.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Ninguém foi adicionado ainda. Por enquanto, só quem pode editar a página a vê.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {grants.map((grant) => {
            const label = grant.userId ? lookups.labelFor("member", grant.userId) : (grant.email ?? "");
            return (
              <li key={grant.id} className="flex items-center gap-3 px-3 py-2">
                {grant.userId ? (
                  <UserPlus className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {grant.userId ? "Membro" : "Convidado por e-mail"} · desde {formatDate(grant.invitedAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remover acesso de ${label}`}
                  onClick={() => setRevoking({ id: grant.id, label })}
                >
                  <X />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        trigger={<span hidden />}
        open={revoking !== null}
        onOpenChange={(open) => !open && setRevoking(null)}
        title="Remover acesso?"
        description={`${revoking?.label ?? ""} deixa de ver esta página imediatamente. Se for um convite por e-mail, o link enviado para de funcionar.`}
        confirmLabel="Remover"
        isLoading={revokeMutation.isPending}
        onConfirm={() => {
          if (!revoking) return;
          revokeMutation.mutate(revoking.id, { onSettled: () => setRevoking(null) });
        }}
      />
    </Section>
  );
}

function PublicLinkSection({
  workspaceId,
  pageId,
  hasActivePublicLink,
}: {
  workspaceId: string;
  pageId: string;
  hasActivePublicLink: boolean;
}) {
  const regenerateMutation = useRegeneratePublicTokenMutation(workspaceId, pageId);
  // The plaintext link exists only in this response — kept in memory while
  // the panel is open, gone for good once it closes.
  const [freshUrl, setFreshUrl] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  function generate() {
    regenerateMutation.mutate(undefined, {
      onSuccess: ({ publicAccessToken }) => {
        setFreshUrl(publicPageUrl(publicAccessToken));
        setCopied(false);
      },
      onSettled: () => setConfirmOpen(false),
    });
  }

  async function copy() {
    if (!freshUrl) return;
    try {
      await navigator.clipboard.writeText(freshUrl);
      setCopied(true);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar automaticamente. Selecione e copie manualmente.");
    }
  }

  return (
    <Section title="Link público">
      {freshUrl ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={freshUrl} onFocus={(event) => event.currentTarget.select()} aria-label="Link público" />
            <Button variant="outline" onClick={copy}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Copie agora: por segurança, você não vai poder ver este link de novo depois de fechar
              este painel. Se perdê-lo, gere um novo.
            </p>
          </div>
        </div>
      ) : hasActivePublicLink ? (
        <div className="flex items-center gap-3 rounded-lg border border-border p-3">
          <Link2 className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Há um link ativo</p>
            <p className="text-xs text-muted-foreground">
              Ele só é mostrado no momento em que é gerado. Perdeu? Gere um novo.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          A página é pública, mas ainda não tem link. Gere um para compartilhar.
        </p>
      )}

      {hasActivePublicLink || freshUrl ? (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          trigger={
            <Button variant="outline" size="sm">
              <RefreshCw /> Gerar novo link
            </Button>
          }
          title="Gerar um novo link?"
          description="O link atual para de funcionar imediatamente — quem o tiver não consegue mais abrir a página. Você precisará enviar o novo link a essas pessoas."
          confirmLabel="Gerar novo link"
          isLoading={regenerateMutation.isPending}
          onConfirm={generate}
        />
      ) : (
        <Button size="sm" onClick={generate} disabled={regenerateMutation.isPending}>
          {regenerateMutation.isPending ? <Loader2 className="animate-spin" /> : <Link2 />}
          Gerar link público
        </Button>
      )}
    </Section>
  );
}

/**
 * Who can see a page, and how it is shared. Only rendered for editors
 * (`canEdit` from the server) — the page editor never mounts it otherwise.
 */
export function PageSharingPanel({
  open,
  onOpenChange,
  workspaceId,
  page,
  lookups,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  page: AuthenticatedDashboardPageView;
  lookups: AutomationLookups;
}) {
  const pagesQuery = useDashboardPagesQuery(workspaceId);
  const hasActivePublicLink =
    pagesQuery.data?.find((summary) => summary.id === page.id)?.hasActivePublicLink ?? false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60">
          <SheetTitle>Compartilhar página</SheetTitle>
          <SheetDescription>{page.name}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <VisibilitySection
            workspaceId={workspaceId}
            page={page}
            hasActivePublicLink={hasActivePublicLink}
          />
          {page.visibility === "RESTRICTED" ? (
            <AccessListSection workspaceId={workspaceId} pageId={page.id} lookups={lookups} />
          ) : null}
          {page.visibility === "PUBLIC" ? (
            <PublicLinkSection
              workspaceId={workspaceId}
              pageId={page.id}
              hasActivePublicLink={hasActivePublicLink}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
