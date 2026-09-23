"use client";

import { Card } from "@/components/ui/card";
import { TutorialGuideLink } from "@/components/shared/tutorial-guide-link";
import { ApiKeysPanel } from "@/features/developers/components/api-keys-panel";
import { WebhooksPanel } from "@/features/developers/components/webhooks-panel";
import { ApiReferenceSection } from "@/features/developers/components/api-reference-section";

// Workspace "Desenvolvedores" page: API keys, webhooks (API.md § 22) and the
// technical API reference, as stacked sections rather than tabs — nothing
// here is behind an extra click. The conceptual explainer (pra que serve,
// quando ignorar) stays in the rich /tutorial guide, linked above; the
// reference below is the machine-facing detail (params, example
// requests/responses, error codes) someone actually integrating needs while
// looking at their keys/webhooks.
export function DevelopersSection({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <TutorialGuideLink guideId="developers" label="Como funciona (visão geral)" />
      </div>

      <Card className="p-4">
        <ApiKeysPanel workspaceId={workspaceId} />
      </Card>

      <Card className="p-4">
        <WebhooksPanel workspaceId={workspaceId} />
      </Card>

      <ApiReferenceSection workspaceId={workspaceId} />
    </div>
  );
}
