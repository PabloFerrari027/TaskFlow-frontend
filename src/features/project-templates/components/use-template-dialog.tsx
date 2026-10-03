"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectsQuery } from "@/features/projects/hooks/use-projects";
import {
  useApplyProjectTemplateMutation,
  useInstantiateDraftMutation,
  useInstantiateProjectTemplateMutation,
} from "@/features/project-templates/hooks/use-project-templates";
import { useInstantiationRunner } from "@/features/project-templates/hooks/use-instantiation-runner";
import {
  InstantiationProgress,
  TemplateChoicesFields,
  initialTemplateChoices,
  missingTemplateChoices,
  toChoicesRequest,
  type TemplateChoicesValue,
  type TemplateQuestions,
} from "@/features/project-templates/components/template-choices-fields";
import { buildTree, flattenTree, getAncestors } from "@/lib/tree";
import type { Project } from "@/types/project";
import type { ProjectTemplateDraft } from "@/types/project-template";
import type { Workspace } from "@/types/workspace";

const NO_PARENT = "__root__";

function ProjectSelect({
  projects,
  value,
  onChange,
  disabled,
  emptyLabel,
  id,
}: {
  projects: Project[];
  value: string;
  onChange: (projectId: string) => void;
  disabled?: boolean;
  emptyLabel?: string;
  id: string;
}) {
  const active = projects.filter((project) => project.status === "ACTIVE");
  const label = (project: Project) =>
    [...getAncestors(active, project.id), project].map((p) => p.name).join(" / ");

  return (
    <Select value={value || (emptyLabel ? NO_PARENT : "")} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Escolha um projeto" />
      </SelectTrigger>
      <SelectContent>
        {emptyLabel ? <SelectItem value={NO_PARENT}>{emptyLabel}</SelectItem> : null}
        {flattenTree(buildTree(active)).map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {label(project)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type Source =
  | { kind: "template"; templateId: string; name: string; questions: TemplateQuestions }
  | { kind: "draft"; draft: ProjectTemplateDraft };

interface UseTemplateDialogProps {
  source: Source;
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens on "add to an existing project", with this one chosen. */
  applyToProjectId?: string;
}

/**
 * Creates a project from a template (or an AI draft), or adds a template to
 * an existing project. The run is queued and followed to the end; it is
 * all-or-nothing, so a failure leaves nothing behind.
 */
export function UseTemplateDialog({
  source,
  workspace,
  open,
  onOpenChange,
  applyToProjectId,
}: UseTemplateDialogProps) {
  const router = useRouter();
  const projectsQuery = useProjectsQuery(workspace.id);
  const projects = projectsQuery.data?.data ?? [];

  const questions: TemplateQuestions =
    source.kind === "template" ? source.questions : source.draft.skeleton;
  const defaultName = source.kind === "template" ? source.name : source.draft.name;

  const [mode, setMode] = React.useState<"new" | "apply">(applyToProjectId ? "apply" : "new");
  const [name, setName] = React.useState(defaultName);
  const [parentId, setParentId] = React.useState("");
  const [targetProjectId, setTargetProjectId] = React.useState(applyToProjectId ?? "");
  const [choices, setChoices] = React.useState<TemplateChoicesValue>(() =>
    initialTemplateChoices(questions)
  );
  const [submitted, setSubmitted] = React.useState(false);

  const instantiateMutation = useInstantiateProjectTemplateMutation(workspace.id);
  const applyMutation = useApplyProjectTemplateMutation();
  const draftMutation = useInstantiateDraftMutation(workspace.id);
  const runner = useInstantiationRunner(workspace.id, (projectId) => {
    router.push(`/projects/${projectId}/tasks`);
    onOpenChange(false);
  });

  const isPending =
    instantiateMutation.isPending || applyMutation.isPending || draftMutation.isPending;
  // Stays locked until the navigation replaces the page: a second submit
  // would create a second project.
  const isLocked = isPending || runner.isRunning;

  const missing = missingTemplateChoices(questions, choices);
  const nameError = mode === "new" && name.trim().length < 2;
  const targetError = mode === "apply" && !targetProjectId;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (isLocked || missing.length > 0 || nameError || targetError) return;

    const request = toChoicesRequest(questions, choices);
    const follow = { onSuccess: runner.follow };

    if (mode === "apply") {
      if (source.kind !== "template") return;
      applyMutation.mutate(
        { projectId: targetProjectId, templateId: source.templateId, input: request },
        follow
      );
      return;
    }
    const newProject = {
      ...request,
      name: name.trim(),
      parentProjectId: parentId && parentId !== NO_PARENT ? parentId : undefined,
    };
    if (source.kind === "template") {
      instantiateMutation.mutate({ templateId: source.templateId, input: newProject }, follow);
    } else {
      draftMutation.mutate(
        {
          ...newProject,
          description: source.draft.description ?? undefined,
          skeleton: source.draft.skeleton,
        },
        follow
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing mid-run would hide the outcome of a non-idempotent call.
        if (isLocked) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{source.kind === "draft" ? "Criar projeto com este rascunho" : "Usar este modelo"}</DialogTitle>
          <DialogDescription>
            Em <strong>{workspace.name}</strong>.{" "}
            {mode === "apply"
              ? "Colunas, campos e tarefas entram depois do que o projeto já tem. Campos com o mesmo nome e tipo são reaproveitados."
              : "Um projeto novo é criado já com a estrutura do modelo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
            {source.kind === "template" ? (
              <Tabs value={mode} onValueChange={(next) => setMode(next as "new" | "apply")}>
                <TabsList>
                  <TabsTrigger value="new" disabled={isLocked}>
                    Projeto novo
                  </TabsTrigger>
                  <TabsTrigger value="apply" disabled={isLocked}>
                    Projeto existente
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            ) : null}

            {mode === "new" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="template-project-name">Nome do projeto</Label>
                  <Input
                    id="template-project-name"
                    autoFocus
                    disabled={isLocked}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  {submitted && nameError ? (
                    <p className="text-xs text-destructive">
                      O nome precisa ter pelo menos 2 caracteres.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="template-parent">Dentro de</Label>
                  <ProjectSelect
                    id="template-parent"
                    projects={projects}
                    value={parentId}
                    onChange={setParentId}
                    disabled={isLocked}
                    emptyLabel="Nenhum (projeto principal)"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="template-target">Projeto</Label>
                <ProjectSelect
                  id="template-target"
                  projects={projects}
                  value={targetProjectId}
                  onChange={setTargetProjectId}
                  disabled={isLocked}
                />
                {submitted && targetError ? (
                  <p className="text-xs text-destructive">Escolha o projeto.</p>
                ) : null}
              </div>
            )}

            <TemplateChoicesFields
              questions={questions}
              value={choices}
              onChange={setChoices}
              members={workspace.members}
              disabled={isLocked}
            />

            {submitted && missing.length > 0 ? (
              <p className="text-sm text-destructive">Preencha: {missing.join(", ")}.</p>
            ) : null}
          </div>

          {runner.isRunning ? (
            <InstantiationProgress
              done={runner.instantiation?.progressDone ?? 0}
              total={runner.instantiation?.progressTotal ?? 0}
              label={mode === "apply" ? "Aplicando o modelo…" : "Montando o projeto…"}
            />
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isLocked}>
              {isLocked ? <Loader2 className="animate-spin" /> : null}
              {isLocked
                ? "Aguarde…"
                : mode === "apply"
                  ? "Aplicar ao projeto"
                  : "Criar projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
