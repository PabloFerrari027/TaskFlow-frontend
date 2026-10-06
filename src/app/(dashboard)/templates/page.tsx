"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { TutorialGuideLink } from "@/components/shared/tutorial-guide-link";
import {
  TemplateGallery,
  TemplateGridSkeleton,
} from "@/features/folder-templates/components/template-gallery";
import { WorkspaceTemplatesSection } from "@/features/folder-templates/components/workspace-templates-section";
import { ApplyToBanner } from "@/features/folder-templates/components/apply-to-banner";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelos"
        description="Comece uma pasta já organizada: escolha um modelo e o TaskFlow cria as colunas, os campos e itens de exemplo para você."
        actions={<TutorialGuideLink guideId="templates" />}
      />
      <Suspense fallback={null}>
        <ApplyToBanner />
        <WorkspaceTemplatesSection />
      </Suspense>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Modelos do TaskFlow</h2>
        {/* Filters live in the query string (useSearchParams). */}
        <Suspense fallback={<TemplateGridSkeleton />}>
          <TemplateGallery />
        </Suspense>
      </section>
    </div>
  );
}
