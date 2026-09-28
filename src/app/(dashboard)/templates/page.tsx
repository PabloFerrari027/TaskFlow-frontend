"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { TutorialGuideLink } from "@/components/shared/tutorial-guide-link";
import {
  TemplateGallery,
  TemplateGridSkeleton,
} from "@/features/project-templates/components/template-gallery";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelos"
        description="Comece um projeto já organizado: escolha um modelo e o TaskFlow cria as colunas, os campos e tarefas de exemplo para você."
        actions={
          <>
            <TutorialGuideLink guideId="templates" />
            <Button asChild variant="outline">
              <Link href="/templates/mine">
                <Package /> Meus modelos
              </Link>
            </Button>
          </>
        }
      />
      {/* Filters live in the query string (useSearchParams). */}
      <Suspense fallback={<TemplateGridSkeleton />}>
        <TemplateGallery />
      </Suspense>
    </div>
  );
}
