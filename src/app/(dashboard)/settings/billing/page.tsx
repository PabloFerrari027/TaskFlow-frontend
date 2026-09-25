import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { TutorialGuideLink } from "@/components/shared/tutorial-guide-link";
import { PlansPage } from "@/features/billing/components/plans-page";

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Plano e cobrança"
        description="Veja seu consumo de IA deste mês e assine ou troque de plano."
        actions={<TutorialGuideLink guideId="plans" />}
      />
      {/* PlansPage reads `?checkout=` via useSearchParams. */}
      <Suspense>
        <PlansPage />
      </Suspense>
    </div>
  );
}
