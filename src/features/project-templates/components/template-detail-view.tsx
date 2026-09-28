"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock, Loader2, Lock, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { getErrorCode } from "@/lib/errors";
import { getCategoryInfo } from "@/features/project-templates/lib/categories";
import {
  formatTemplateCounts,
  getAuthorLabel,
} from "@/features/project-templates/lib/template-labels";
import {
  TemplatePriceBadge,
  TemplateStatusBadge,
} from "@/features/project-templates/components/template-badges";
import { TemplatePrimaryAction } from "@/features/project-templates/components/template-primary-action";
import { TemplateStructurePreview } from "@/features/project-templates/components/template-structure-preview";
import { AuthorTemplateActions } from "@/features/project-templates/components/author-template-actions";
import {
  useInvalidatePurchasedProjectTemplates,
  useProjectTemplateCategoriesQuery,
  useProjectTemplateQuery,
} from "@/features/project-templates/hooks/use-project-templates";

const CHECKOUT_POLL_MS = 3_000;
const CHECKOUT_POLL_LIMIT_MS = 2 * 60_000;

type CheckoutPhase = "idle" | "confirming" | "timeout";

function BackToHub() {
  return (
    <Link
      href="/templates"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Modelos
    </Link>
  );
}

function Banner({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm"
    >
      <span className="mt-0.5 shrink-0 text-muted-foreground [&_svg]:size-4">{icon}</span>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

/**
 * `/templates/[templateId]` is also where Stripe sends the buyer back
 * (`?checkout=success|cancel`, API.md § 26.6). Access is granted by Stripe's
 * webhook, not by that return trip — so on success the detail is re-read
 * every few seconds until `access` flips, and after two minutes the page
 * stops waiting and explains why (slow methods like boleto take days).
 */
export function TemplateDetailView({ templateId }: { templateId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const checkoutParam = searchParams.get("checkout");

  // Read once: the param is removed from the URL as soon as it's handled, and
  // the page still has to remember it was waiting for a payment.
  const [phase, setPhase] = React.useState<CheckoutPhase>(() =>
    checkoutParam === "success" ? "confirming" : "idle"
  );

  const categoriesQuery = useProjectTemplateCategoriesQuery();
  const invalidatePurchased = useInvalidatePurchasedProjectTemplates();
  const detailQuery = useProjectTemplateQuery(templateId, {
    refetchInterval: (template) =>
      phase === "confirming" && template?.access === "PURCHASE_REQUIRED" ? CHECKOUT_POLL_MS : false,
  });

  const template = detailQuery.data;
  const accessSettled = template !== undefined && template.access !== "PURCHASE_REQUIRED";
  const isConfirming = phase === "confirming" && !accessSettled && !detailQuery.isError;

  const clearCheckoutParam = React.useCallback(
    () => router.replace(pathname, { scroll: false }),
    [router, pathname]
  );

  React.useEffect(() => {
    if (checkoutParam !== "cancel") return;
    // Fixed id: a remount (or StrictMode's double effect) doesn't stack toasts.
    toast.info("Compra cancelada. Nada foi cobrado.", { id: `checkout-cancel-${templateId}` });
    clearCheckoutParam();
  }, [checkoutParam, templateId, clearCheckoutParam]);

  React.useEffect(() => {
    if (phase !== "confirming" || !accessSettled) return;
    if (template?.access === "PURCHASED") {
      toast.success("Pagamento confirmado! O modelo já é seu.", {
        id: `checkout-confirmed-${templateId}`,
      });
      invalidatePurchased();
    }
    if (checkoutParam) clearCheckoutParam();
  }, [
    phase,
    accessSettled,
    template?.access,
    templateId,
    invalidatePurchased,
    checkoutParam,
    clearCheckoutParam,
  ]);

  React.useEffect(() => {
    if (!isConfirming) return;
    const timer = setTimeout(() => {
      setPhase("timeout");
      clearCheckoutParam();
    }, CHECKOUT_POLL_LIMIT_MS);
    return () => clearTimeout(timer);
  }, [isConfirming, clearCheckoutParam]);

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!template) {
    if (getErrorCode(detailQuery.error) === "PROJECT_TEMPLATE_NOT_FOUND") {
      return (
        <EmptyState
          icon={<SearchX className="size-6" />}
          title="Este modelo não está mais disponível"
          description="Ele pode ter sido tirado do hub pelo autor ou pela moderação."
          action={
            <Button asChild variant="outline">
              <Link href="/templates">Voltar para os modelos</Link>
            </Button>
          }
        />
      );
    }
    return <ErrorState error={detailQuery.error} onRetry={() => detailQuery.refetch()} />;
  }

  const category = getCategoryInfo(template.category, categoriesQuery.data);
  const isAuthor = template.access === "AUTHOR";
  const paymentPending = phase === "timeout" && template.access === "PURCHASE_REQUIRED";

  return (
    <div className="space-y-6">
      <BackToHub />

      {isConfirming ? (
        <Banner icon={<Loader2 className="animate-spin" />}>
          <p className="font-medium text-foreground">Confirmando pagamento…</p>
          <p className="text-muted-foreground">
            Costuma levar só alguns segundos. Você pode continuar nesta página.
          </p>
        </Banner>
      ) : null}

      {paymentPending ? (
        <Banner icon={<Clock />}>
          <p className="font-medium text-foreground">O pagamento ainda não foi confirmado</p>
          <p className="text-muted-foreground">
            Pagamentos como boleto podem levar alguns dias para serem confirmados. Assim que
            forem, o modelo aparece em{" "}
            <Link href="/templates/mine" className="font-medium text-primary hover:underline">
              Comprados
            </Link>
            . Se você já pagou, não precisa comprar de novo.
          </p>
        </Banner>
      ) : null}

      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              <span aria-hidden>{category.icon}</span> {category.label}
            </span>
            <TemplatePriceBadge priceCents={template.priceCents} />
            {isAuthor && template.status !== "PUBLISHED" ? (
              <TemplateStatusBadge status={template.status} />
            ) : null}
            {template.access === "PURCHASED" ? (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                Você comprou este modelo
              </span>
            ) : null}
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">{template.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Por {isAuthor ? "você" : getAuthorLabel(template)} · {formatTemplateCounts(template)}
          </p>
          {template.description ? (
            <CardDescription className="whitespace-pre-line text-foreground/80">
              {template.description}
            </CardDescription>
          ) : null}
        </CardHeader>
        {!isConfirming ? (
          <CardContent>
            <TemplatePrimaryAction template={template} />
          </CardContent>
        ) : null}
      </Card>

      {isAuthor ? (
        <Card>
          <CardHeader>
            <CardTitle>Você publicou este modelo</CardTitle>
            <CardDescription>
              {template.status === "REMOVED"
                ? "A moderação tirou este modelo do hub. Ele não pode voltar nem ser usado, mas você ainda pode excluí-lo."
                : "Só você vê estas ações. A estrutura não muda: para atualizá-la, publique o projeto de novo."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthorTemplateActions
              template={template}
              onDeleted={() => router.push("/templates/mine")}
            />
          </CardContent>
        </Card>
      ) : null}

      {template.skeleton ? (
        <TemplateStructurePreview skeleton={template.skeleton} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4" aria-hidden /> Conteúdo completo depois da compra
            </CardTitle>
            <CardDescription>
              Este modelo traz {formatTemplateCounts(template)}. Os nomes das colunas, dos campos
              e as tarefas de exemplo aparecem aqui assim que a compra for confirmada.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
