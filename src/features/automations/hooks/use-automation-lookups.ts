"use client";

import * as React from "react";
import { useQueries } from "@tanstack/react-query";
import {
  PROJECT_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
} from "@/components/shared/status-badge";
import { sectionsService } from "@/features/sections/api/sections-service";
import { useProjectsQuery } from "@/features/projects/hooks/use-projects";
import { useWorkspaceQuery } from "@/features/workspaces/hooks/use-workspaces";
import type { FieldKind } from "@/features/automations/lib/automation-catalog";
import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import { useAuth } from "@/lib/auth/auth-context";
import { shortenId } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { buildTree, flattenTree, getAncestors } from "@/lib/tree";
import { MAX_PAGE_SIZE } from "@/types/common";
import type { Section } from "@/types/section";

export interface PickerOption {
  value: string;
  label: string;
  // Options sharing a group are listed under one heading (sections by project).
  group?: string;
  keywords?: string[];
}

export interface AutomationLookups extends ValueLabeler {
  /** Options for an enum/entity kind; null for kinds that are typed in freely. */
  optionsFor(kind: FieldKind): PickerOption[] | null;
  isLoading: boolean;
}

const STATUS_OPTIONS: PickerOption[] = Object.entries(TASK_STATUS_LABEL).map(
  ([value, label]) => ({ value, label })
);
const PRIORITY_OPTIONS: PickerOption[] = Object.entries(TASK_PRIORITY_LABEL).map(
  ([value, label]) => ({ value, label })
);
const PROJECT_STATUS_OPTIONS: PickerOption[] = Object.entries(PROJECT_STATUS_LABEL).map(
  ([value, label]) => ({ value, label })
);

interface SectionsCombined {
  sections: Section[];
  isLoading: boolean;
}

// Sections have no workspace-level endpoint, so a rule's section can only be
// found by asking every project. The query key/fn are the same ones the board
// uses (`useSectionsQuery`), so a project already opened is served from cache.
export function useAutomationLookups(workspaceId: string): AutomationLookups {
  const { userId: currentUserId } = useAuth();
  const workspaceQuery = useWorkspaceQuery(workspaceId);
  const projectsQuery = useProjectsQuery(workspaceId);
  const projects = React.useMemo(() => projectsQuery.data?.data ?? [], [projectsQuery.data]);

  const sectionsResult = useQueries({
    queries: projects.map((project) => ({
      queryKey: queryKeys.sections.all(project.id),
      queryFn: () => sectionsService.listByProject(project.id, { limit: MAX_PAGE_SIZE }),
    })),
    combine: (results): SectionsCombined => ({
      sections: results.flatMap((result) => result.data?.data ?? []),
      isLoading: results.some((result) => result.isLoading),
    }),
  });

  const members = workspaceQuery.data?.members;
  const isLoading =
    workspaceQuery.isLoading || projectsQuery.isLoading || sectionsResult.isLoading;

  return React.useMemo(() => {
    const memberNames = new Map(
      (members ?? []).map((member) => [member.userId, member.name?.trim()])
    );
    const memberLabel = (userId: string) =>
      userId === currentUserId
        ? "Você"
        : memberNames.get(userId) || `Usuário ${shortenId(userId)}…`;

    const projectLabels = new Map(
      projects.map((project) => [
        project.id,
        [...getAncestors(projects, project.id), project].map((p) => p.name).join(" / "),
      ])
    );

    const sectionsByProject = new Map<string, Section[]>();
    for (const section of sectionsResult.sections) {
      sectionsByProject.set(section.projectId, [
        ...(sectionsByProject.get(section.projectId) ?? []),
        section,
      ]);
    }

    // Sub-sections are listed under their parent with the full path as the
    // label ("Backlog / Ideias"), the same as the task's own section select.
    const sectionOptions: PickerOption[] = [];
    const sectionLabels = new Map<string, string>();
    for (const project of projects) {
      const sections = sectionsByProject.get(project.id) ?? [];
      const projectName = projectLabels.get(project.id) ?? project.name;
      for (const section of flattenTree(buildTree(sections))) {
        const path = [...getAncestors(sections, section.id), section].map((s) => s.name).join(" / ");
        sectionLabels.set(section.id, `${projectName} / ${path}`);
        sectionOptions.push({ value: section.id, label: path, group: projectName });
      }
    }

    const projectOptions: PickerOption[] = projects.map((project) => ({
      value: project.id,
      label: projectLabels.get(project.id) ?? project.name,
    }));

    const memberOptions: PickerOption[] = (members ?? []).map((member) => ({
      value: member.userId,
      label: memberLabel(member.userId),
      keywords: [member.role, member.userId],
    }));

    const unknown = (kind: string, id: string) => `${kind} ${shortenId(id)}…`;

    return {
      isLoading,
      optionsFor(kind) {
        switch (kind) {
          case "taskStatus":
            return STATUS_OPTIONS;
          case "taskPriority":
            return PRIORITY_OPTIONS;
          case "projectStatus":
            return PROJECT_STATUS_OPTIONS;
          case "member":
            return memberOptions;
          case "project":
            return projectOptions;
          case "section":
            return sectionOptions;
          default:
            return null;
        }
      },
      labelFor(kind, value) {
        switch (kind) {
          case "taskStatus":
            return (TASK_STATUS_LABEL as Record<string, string>)[value] ?? value;
          case "taskPriority":
            return (TASK_PRIORITY_LABEL as Record<string, string>)[value] ?? value;
          case "projectStatus":
            return (PROJECT_STATUS_LABEL as Record<string, string>)[value] ?? value;
          case "member":
            return memberLabel(value);
          case "project":
            return projectLabels.get(value) ?? unknown("projeto", value);
          case "section":
            return sectionLabels.get(value) ?? unknown("seção", value);
          default:
            return value;
        }
      },
    };
  }, [currentUserId, isLoading, members, projects, sectionsResult.sections]);
}
