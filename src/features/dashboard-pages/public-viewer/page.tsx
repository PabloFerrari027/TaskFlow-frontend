"use client";

import axios from "axios";
import { Link2Off, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardGrid } from "@/features/dashboard-pages/components/dashboard-grid";
import type { SharedPageLinkKind } from "@/features/dashboard-pages/api/dashboard-pages-service";
import { useSharedDashboardPageQuery } from "@/features/dashboard-pages/hooks/use-dashboard-pages";
import { getErrorCode } from "@/lib/errors";

function Message({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Link2Off className="size-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

/**
 * What someone opening a public or guest link sees — and nothing more. No
 * sidebar, no workspace menu, no sign-in prompt, no link anywhere else in
 * the app: this surface is isolated on purpose, and must never read as a
 * login screen in disguise. Charts are drawn by the same renderers as the
 * signed-in page, in the same (fixed) layout; only where the data comes
 * from differs. Ids can't be resolved to names here (the viewer has no
 * access to members or projects), so those show as short references.
 */
export function SharedPageViewer({ kind, token }: { kind: SharedPageLinkKind; token: string }) {
  const pageQuery = useSharedDashboardPageQuery(kind, token);

  if (pageQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pageQuery.isError || !pageQuery.data) {
    const invalidLink =
      getErrorCode(pageQuery.error) === "PAGE_ACCESS_TOKEN_INVALID" ||
      (axios.isAxiosError(pageQuery.error) && pageQuery.error.response?.status === 404);
    return invalidLink ? (
      <Message
        title="Este link não é válido ou foi revogado"
        description="Peça um link novo para quem compartilhou esta página com você."
      />
    ) : (
      <Message
        title="Não foi possível abrir a página agora"
        description="Verifique sua conexão e tente novamente em instantes."
        action={
          <Button variant="outline" onClick={() => pageQuery.refetch()}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  const page = pageQuery.data;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <header className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{page.name}</h1>
      </header>
      {page.charts.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Esta página ainda não tem gráficos.
        </p>
      ) : (
        <DashboardGrid charts={page.charts} editable={false} />
      )}
    </div>
  );
}
