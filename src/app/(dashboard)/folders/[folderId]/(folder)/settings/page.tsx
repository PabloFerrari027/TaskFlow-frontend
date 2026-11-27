"use client";

import { use } from "react";
import { WorkflowStatusesSection } from "@/features/items/components/workflow-statuses-section";
import { FolderAppearanceSection } from "@/features/folders/components/folder-appearance-section";
import { BlockedCompletionSection } from "@/features/folders/components/blocked-completion-section";
import { IntakeFormsSection } from "@/features/intake-forms/components/intake-forms-section";
import { DataPortabilitySection } from "@/features/data-portability/components/data-portability-section";

// Folder-wide settings, as stacked sections (never tabs inside a tab).
export default function FolderSettingsPage(props: PageProps<"/folders/[folderId]/settings">) {
  const { folderId } = use(props.params);

  return (
    <div className="space-y-6">
      <FolderAppearanceSection folderId={folderId} />
      <WorkflowStatusesSection folderId={folderId} />
      <BlockedCompletionSection folderId={folderId} />
      <IntakeFormsSection folderId={folderId} />
      <DataPortabilitySection folderId={folderId} />
    </div>
  );
}
