"use client";

import Link from "next/link";
import { Package, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { formatDate } from "@/lib/format";
import { getCategoryInfo } from "@/features/project-templates/lib/categories";
import { formatTemplateCounts } from "@/features/project-templates/lib/template-labels";
import {
  TemplatePriceBadge,
  TemplateStatusBadge,
} from "@/features/project-templates/components/template-badges";
import { AuthorTemplateActions } from "@/features/project-templates/components/author-template-actions";
import { TemplateCard } from "@/features/project-templates/components/template-card";
import { TemplateGrid } from "@/features/project-templates/components/template-gallery";
import {
  useMyProjectTemplatesQuery,
  useProjectTemplateCategoriesQuery,
  usePurchasedProjectTemplatesQuery,
} from "@/features/project-templates/hooks/use-project-templates";

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

function PublishedByMe() {
  const mineQuery = useMyProjectTemplatesQuery();
  const categoriesQuery = useProjectTemplateCategoriesQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publicados por mim</CardTitle>
        <CardDescription>
          Cada modelo é uma cópia congelada da estrutura do projeto no dia em que foi publicado.
          Para atualizar, publique o projeto de novo e tire o antigo do hub.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mineQuery.isLoading ? (
          <ListSkeleton />
        ) : mineQuery.isError ? (
          <ErrorState error={mineQuery.error} onRetry={() => mineQuery.refetch()} />
        ) : !mineQuery.data?.length ? (
          <EmptyState
            icon={<Package className="size-6" />}
            title="Você ainda não publicou nenhum modelo"
            description="Abra um projeto seu e use “Publicar como modelo” para compartilhar a organização dele."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {mineQuery.data.map((template) => {
              const category = getCategoryInfo(template.category, categoriesQuery.data);
              return (
                <li key={template.id} className="space-y-3 py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/templates/${template.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {template.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        <span aria-hidden>{category.icon}</span> {category.label} ·{" "}
                        {formatTemplateCounts(template)} · publicado em{" "}
                        {formatDate(template.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <TemplateStatusBadge status={template.status} />
                      <TemplatePriceBadge priceCents={template.priceCents} />
                    </div>
                  </div>
                  {template.status === "REMOVED" ? (
                    <p className="text-xs text-muted-foreground">
                      A moderação tirou este modelo do hub. Ele não pode voltar nem ser usado.
                    </p>
                  ) : null}
                  <AuthorTemplateActions template={template} />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Purchased() {
  const purchasedQuery = usePurchasedProjectTemplatesQuery();
  const categoriesQuery = useProjectTemplateCategoriesQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comprados</CardTitle>
        <CardDescription>
          Modelos pagos que você comprou. Você pode usá-los quantas vezes quiser, mesmo que o autor
          tire do hub depois.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {purchasedQuery.isLoading ? (
          <ListSkeleton />
        ) : purchasedQuery.isError ? (
          <ErrorState error={purchasedQuery.error} onRetry={() => purchasedQuery.refetch()} />
        ) : !purchasedQuery.data?.length ? (
          <EmptyState
            icon={<ShoppingBag className="size-6" />}
            title="Nenhuma compra por aqui"
            description="Um pagamento por boleto pode levar alguns dias para ser confirmado e aparecer nesta lista."
          />
        ) : (
          <TemplateGrid>
            {purchasedQuery.data.map((template) => (
              <TemplateCard key={template.id} template={template} categories={categoriesQuery.data} />
            ))}
          </TemplateGrid>
        )}
      </CardContent>
    </Card>
  );
}

export function MyTemplatesSections() {
  return (
    <div className="space-y-6">
      <PublishedByMe />
      <Purchased />
    </div>
  );
}
