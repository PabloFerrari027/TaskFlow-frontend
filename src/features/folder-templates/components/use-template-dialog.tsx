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
import { useFoldersQuery } from "@/features/folders/hooks/use-folders";
import {
  useApplyFolderTemplateMutation,
  useInstantiateDraftMutation,
  useInstantiateFolderTemplateMutation,
} from "@/features/folder-templates/hooks/use-folder-templates";
import { useInstantiationRunner } from "@/features/folder-templates/hooks/use-instantiation-runner";
import {
  InstantiationProgress,
  TemplateChoicesFields,
  initialTemplateChoices,
  missingTemplateChoices,
  toChoicesRequest,
  type TemplateChoicesValue,
  type TemplateQuestions,
} from "@/features/folder-templates/components/template-choices-fields";
import { buildTree, flattenTree, getAncestors } from "@/lib/tree";
import type { Folder } from "@/types/folder";
import type { FolderTemplateDraft } from "@/types/folder-template";
import type { Workspace } from "@/types/workspace";

const NO_PARENT = "__root__";

function FolderSelect({
  folders,
  value,
  onChange,
  disabled,
  emptyLabel,
  id,
}: {
  folders: Folder[];
  value: string;
  onChange: (folderId: string) => void;
  disabled?: boolean;
  emptyLabel?: string;
  id: string;
}) {
  const active = folders.filter((folder) => folder.status === "ACTIVE");
  const label = (folder: Folder) =>
    [...getAncestors(active, folder.id), folder].map((p) => p.name).join(" / ");

  return (
    <Select value={value || (emptyLabel ? NO_PARENT : "")} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Escolha uma pasta" />
      </SelectTrigger>
      <SelectContent>
        {emptyLabel ? <SelectItem value={NO_PARENT}>{emptyLabel}</SelectItem> : null}
        {flattenTree(buildTree(active)).map((folder) => (
          <SelectItem key={folder.id} value={folder.id}>
            {label(folder)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type Source =
  | { kind: "template"; templateId: string; name: string; questions: TemplateQuestions }
  | { kind: "draft"; draft: FolderTemplateDraft };

interface UseTemplateDialogProps {
  source: Source;
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens on "add to an existing folder", with this one chosen. */
  applyToFolderId?: string;
}

/**
 * Creates a folder from a template (or an AI draft), or adds a template to
 * an existing folder. The run is queued and followed to the end; it is
 * all-or-nothing, so a failure leaves nothing behind.
 */
export function UseTemplateDialog({
  source,
  workspace,
  open,
  onOpenChange,
  applyToFolderId,
}: UseTemplateDialogProps) {
  const router = useRouter();
  const foldersQuery = useFoldersQuery(workspace.id);
  const folders = foldersQuery.data?.data ?? [];

  const questions: TemplateQuestions =
    source.kind === "template" ? source.questions : source.draft.skeleton;
  const defaultName = source.kind === "template" ? source.name : source.draft.name;

  const [mode, setMode] = React.useState<"new" | "apply">(applyToFolderId ? "apply" : "new");
  const [name, setName] = React.useState(defaultName);
  const [parentId, setParentId] = React.useState("");
  const [targetFolderId, setTargetFolderId] = React.useState(applyToFolderId ?? "");
  const [choices, setChoices] = React.useState<TemplateChoicesValue>(() =>
    initialTemplateChoices(questions)
  );
  const [submitted, setSubmitted] = React.useState(false);

  const instantiateMutation = useInstantiateFolderTemplateMutation(workspace.id);
  const applyMutation = useApplyFolderTemplateMutation();
  const draftMutation = useInstantiateDraftMutation(workspace.id);
  const runner = useInstantiationRunner(workspace.id, (folderId) => {
    router.push(`/folders/${folderId}/items`);
    onOpenChange(false);
  });

  const isPending =
    instantiateMutation.isPending || applyMutation.isPending || draftMutation.isPending;
  // Stays locked until the navigation replaces the page: a second submit
  // would create a second folder.
  const isLocked = isPending || runner.isRunning;

  const missing = missingTemplateChoices(questions, choices);
  const nameError = mode === "new" && name.trim().length < 2;
  const targetError = mode === "apply" && !targetFolderId;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (isLocked || missing.length > 0 || nameError || targetError) return;

    const request = toChoicesRequest(questions, choices);
    const follow = { onSuccess: runner.follow };

    if (mode === "apply") {
      if (source.kind !== "template") return;
      applyMutation.mutate(
        { folderId: targetFolderId, templateId: source.templateId, input: request },
        follow
      );
      return;
    }
    const newFolder = {
      ...request,
      name: name.trim(),
      parentFolderId: parentId && parentId !== NO_PARENT ? parentId : undefined,
    };
    if (source.kind === "template") {
      instantiateMutation.mutate({ templateId: source.templateId, input: newFolder }, follow);
    } else {
      draftMutation.mutate(
        {
          ...newFolder,
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
          <DialogTitle>{source.kind === "draft" ? "Criar pasta com este rascunho" : "Usar este modelo"}</DialogTitle>
          <DialogDescription>
            Em <strong>{workspace.name}</strong>.{" "}
            {mode === "apply"
              ? "Colunas, campos e itens entram depois do que a pasta já tem. Campos com o mesmo nome e tipo são reaproveitados."
              : "Uma pasta nova é criada já com a estrutura do modelo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
            {source.kind === "template" ? (
              <Tabs value={mode} onValueChange={(next) => setMode(next as "new" | "apply")}>
                <TabsList>
                  <TabsTrigger value="new" disabled={isLocked}>
                    Pasta nova
                  </TabsTrigger>
                  <TabsTrigger value="apply" disabled={isLocked}>
                    Pasta existente
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            ) : null}

            {mode === "new" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="template-folder-name">Nome da pasta</Label>
                  <Input
                    id="template-folder-name"
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
                  <FolderSelect
                    id="template-parent"
                    folders={folders}
                    value={parentId}
                    onChange={setParentId}
                    disabled={isLocked}
                    emptyLabel="Nenhum (pasta principal)"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="template-target">Pasta</Label>
                <FolderSelect
                  id="template-target"
                  folders={folders}
                  value={targetFolderId}
                  onChange={setTargetFolderId}
                  disabled={isLocked}
                />
                {submitted && targetError ? (
                  <p className="text-xs text-destructive">Escolha a pasta.</p>
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
              label={mode === "apply" ? "Aplicando o modelo…" : "Montando a pasta…"}
            />
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isLocked}>
              {isLocked ? <Loader2 className="animate-spin" /> : null}
              {isLocked
                ? "Aguarde…"
                : mode === "apply"
                  ? "Aplicar à pasta"
                  : "Criar pasta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
