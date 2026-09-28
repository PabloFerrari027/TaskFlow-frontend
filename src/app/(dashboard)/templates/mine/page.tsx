"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { TutorialGuideLink } from "@/components/shared/tutorial-guide-link";
import { MyTemplatesSections } from "@/features/project-templates/components/my-templates-sections";

export default function MyTemplatesPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Modelos
      </Link>
      <PageHeader
        title="Meus modelos"
        description="Os modelos que você publicou e os que você comprou."
        actions={<TutorialGuideLink guideId="templates" />}
      />
      <MyTemplatesSections />
    </div>
  );
}
