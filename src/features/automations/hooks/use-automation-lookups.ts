"use client";

import * as React from "react";
import { useQueries } from "@tanstack/react-query";
import {
  FOLDER_STATUS_LABEL,
  ITEM_PRIORITY_LABEL,
  ITEM_STATUS_LABEL,
} from "@/components/shared/status-badge";
import { sectionsService } from "@/features/sections/api/sections-service";
import { itemsService } from "@/features/items/api/items-service";
import {
  STATUS_CATEGORIES,
  statusesOfCategory,
} from "@/features/items/hooks/use-workflow-statuses";
import {
  parseWorkflowStatusValue,
  toWorkflowStatusValue,
} from "@/features/automations/lib/automation-catalog";
import { useFoldersQuery } from "@/features/folders/hooks/use-folders";
import { useWorkspaceQuery } from "@/features/workspaces/hooks/use-workspaces";
import type { FieldKind } from "@/features/automations/lib/automation-catalog";
import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import { useAuth } from "@/lib/auth/auth-context";
import { shortenId } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { buildTree, flattenTree, getAncestors } from "@/lib/tree";
import { MAX_PAGE_SIZE } from "@/types/common";
import type { Section } from "@/types/section";
import type { WorkflowStatus } from "@/types/item";

export interface PickerOption {
  value: string;
  label: string;
  // Options sharing a group are listed under one heading (sections by folder).
  group?: string;
  keywords?: string[];
}

export interface AutomationLookups extends ValueLabeler {
  /** Options for an enum/entity kind; null for kinds that are typed in freely. */
  optionsFor(kind: FieldKind): PickerOption[] | null;
  isLoading: boolean;
}

const STATUS_OPTIONS: PickerOption[] = Object.entries(ITEM_STATUS_LABEL).map(
  ([value, label]) => ({ value, label })
);
const PRIORITY_OPTIONS: PickerOption[] = Object.entries(ITEM_PRIORITY_LABEL).map(
  ([value, label]) => ({ value, label })
);
const FOLDER_STATUS_OPTIONS: PickerOption[] = Object.entries(FOLDER_STATUS_LABEL).map(
  ([value, label]) => ({ value, label })
);

const APPROVAL_DECISION_LABEL: Record<string, string> = {
  APPROVED: "aprovada",
  REJECTED: "recusada",
};

const APPROVAL_DECISION_OPTIONS: PickerOption[] = Object.entries(APPROVAL_DECISION_LABEL).map(
  ([value, label]) => ({ value, label })
);

interface SectionsCombined {
  sections: Section[];
  isLoading: boolean;
}

interface StatusesCombined {
  statuses: WorkflowStatus[];
  isLoading: boolean;
}

// What a rule without `statusId` does: the category's default etapa.
const CATEGORY_DEFAULT_OPTIONS: PickerOption[] = STATUS_CATEGORIES.map((category) => ({
  value: category,
  label: `${ITEM_STATUS_LABEL[category]} (etapa padrão)`,
  group: "Qualquer pasta",
}));

// Sections have no workspace-level endpoint, so a rule's section can only be
// found by asking every folder. The query key/fn are the same ones the board
// uses (`useSectionsQuery`), so a folder already opened is served from cache.
export function useAutomationLookups(workspaceId: string): AutomationLookups {
  const { userId: currentUserId } = useAuth();
  const workspaceQuery = useWorkspaceQuery(workspaceId);
  const foldersQuery = useFoldersQuery(workspaceId);
  const folders = React.useMemo(() => foldersQuery.data?.data ?? [], [foldersQuery.data]);

  const sectionsResult = useQueries({
    queries: folders.map((folder) => ({
      queryKey: queryKeys.sections.all(folder.id),
      queryFn: () => sectionsService.listByFolder(folder.id, { limit: MAX_PAGE_SIZE }),
    })),
    combine: (results): SectionsCombined => ({
      sections: results.flatMap((result) => result.data?.data ?? []),
      isLoading: results.some((result) => result.isLoading),
    }),
  });

  // Same key/fn as `useFolderStatusesQuery`, so an opened folder is cached.
  const statusesResult = useQueries({
    queries: folders.map((folder) => ({
      queryKey: queryKeys.statuses.all(folder.id),
      queryFn: () => itemsService.listStatuses(folder.id),
      staleTime: 5 * 60_000,
    })),
    combine: (results): StatusesCombined => ({
      statuses: results.flatMap((result) => result.data ?? []),
      isLoading: results.some((result) => result.isLoading),
    }),
  });

  const members = workspaceQuery.data?.members;
  const workflowStatuses = statusesResult.statuses;
  const isLoading =
    workspaceQuery.isLoading ||
    foldersQuery.isLoading ||
    sectionsResult.isLoading ||
    statusesResult.isLoading;

  return React.useMemo(() => {
    const memberNames = new Map(
      (members ?? []).map((member) => [member.userId, member.name?.trim()])
    );
    const memberLabel = (userId: string) =>
      userId === currentUserId
        ? "Você"
        : memberNames.get(userId) || `Usuário ${shortenId(userId)}…`;

    const folderLabels = new Map(
      folders.map((folder) => [
        folder.id,
        [...getAncestors(folders, folder.id), folder].map((p) => p.name).join(" / "),
      ])
    );

    const sectionsByFolder = new Map<string, Section[]>();
    for (const section of sectionsResult.sections) {
      sectionsByFolder.set(section.folderId, [
        ...(sectionsByFolder.get(section.folderId) ?? []),
        section,
      ]);
    }

    // Sub-sections are listed under their parent with the full path as the
    // label ("Backlog / Ideias"), the same as the item's own section select.
    const sectionOptions: PickerOption[] = [];
    const sectionLabels = new Map<string, string>();
    for (const folder of folders) {
      const sections = sectionsByFolder.get(folder.id) ?? [];
      const folderName = folderLabels.get(folder.id) ?? folder.name;
      for (const section of flattenTree(buildTree(sections))) {
        const path = [...getAncestors(sections, section.id), section].map((s) => s.name).join(" / ");
        sectionLabels.set(section.id, `${folderName} / ${path}`);
        sectionOptions.push({ value: section.id, label: path, group: folderName });
      }
    }

    const folderOptions: PickerOption[] = folders.map((folder) => ({
      value: folder.id,
      label: folderLabels.get(folder.id) ?? folder.name,
    }));

    const memberOptions: PickerOption[] = (members ?? []).map((member) => ({
      value: member.userId,
      label: memberLabel(member.userId),
      keywords: [member.role, member.userId],
    }));

    // A custom etapa only exists in its own folder, so options are grouped by
    // folder; the backend refuses one from another folder when the rule runs.
    const statusOptions: PickerOption[] = [...CATEGORY_DEFAULT_OPTIONS];
    const statusLabels = new Map<string, string>();
    for (const folder of folders) {
      const folderName = folderLabels.get(folder.id) ?? folder.name;
      const own = workflowStatuses.filter((status) => status.folderId === folder.id);
      for (const category of STATUS_CATEGORIES) {
        for (const status of statusesOfCategory(own, category)) {
          statusLabels.set(status.id, `${status.name} (${folderName})`);
          statusOptions.push({
            value: toWorkflowStatusValue(category, status.id),
            label: status.name,
            group: folderName,
            keywords: [ITEM_STATUS_LABEL[category]],
          });
        }
      }
    }

    const unknown = (kind: string, id: string) => `${kind} ${shortenId(id)}…`;

    return {
      isLoading,
      optionsFor(kind) {
        switch (kind) {
          case "itemStatus":
            return STATUS_OPTIONS;
          case "workflowStatus":
            return statusOptions;
          case "itemPriority":
            return PRIORITY_OPTIONS;
          case "folderStatus":
            return FOLDER_STATUS_OPTIONS;
          case "approvalDecision":
            return APPROVAL_DECISION_OPTIONS;
          case "member":
            return memberOptions;
          case "folder":
            return folderOptions;
          case "section":
            return sectionOptions;
          default:
            return null;
        }
      },
      labelFor(kind, value) {
        switch (kind) {
          case "itemStatus":
            return (ITEM_STATUS_LABEL as Record<string, string>)[value] ?? value;
          case "workflowStatus": {
            const { status, statusId } = parseWorkflowStatusValue(value);
            const category = (ITEM_STATUS_LABEL as Record<string, string>)[status] ?? status;
            if (!statusId) return category;
            return statusLabels.get(statusId) ?? `${category} (etapa ${shortenId(statusId)}…)`;
          }
          case "itemPriority":
            return (ITEM_PRIORITY_LABEL as Record<string, string>)[value] ?? value;
          case "folderStatus":
            return (FOLDER_STATUS_LABEL as Record<string, string>)[value] ?? value;
          case "approvalDecision":
            return APPROVAL_DECISION_LABEL[value] ?? value;
          case "member":
            return memberLabel(value);
          case "folder":
            return folderLabels.get(value) ?? unknown("pasta", value);
          case "section":
            return sectionLabels.get(value) ?? unknown("seção", value);
          default:
            return value;
        }
      },
    };
  }, [
    currentUserId,
    isLoading,
    members,
    folders,
    sectionsResult.sections,
    workflowStatuses,
  ]);
}
