"use client";

import * as React from "react";
import { History, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_SNAPSHOT_OPTIONS,
  SnapshotOptionsFields,
  toSnapshotRequest,
  type SnapshotOptionsValue,
} from "@/features/folder-templates/components/snapshot-options-fields";
import {
  usePublishTemplateVersionMutation,
  useTemplateVersionsQuery,
} from "@/features/folder-templates/hooks/use-folder-templates";
import { formatDate } from "@/lib/format";
import type { FolderTemplateDetail } from "@/types/folder-template";

/**
 * A workspace template is a frozen copy of its source folder. A new version
 * reads that folder again; people who used an older one see "versão nova".
 */
export function PublishVersionDialog({
  template,
  workspaceId,
  open,
  onOpenChange,
}: {
  template: FolderTemplateDetail;
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const publishMutation = usePublishTemplateVersionMutation(template.id);
  const [options, setOptions] = React.useState<SnapshotOptionsValue>(DEFAULT_SNAPSHOT_OPTIONS);
  const [changelog, setChangelog] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={(next) => !publishMutation.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publicar versão {template.version + 1}</DialogTitle>
          <DialogDescription>
            O modelo é lido de novo da pasta de origem, como ela está agora. As pastas já
            criados não mudam.
          </DialogDescription>
        </DialogHeader>
        <SnapshotOptionsFields workspaceId={workspaceId} value={options} onChange={setOptions} />
        <div className="space-y-1.5">
          <Label htmlFor="version-changelog">O que mudou (opcional)</Label>
          <Textarea
            id="version-changelog"
            rows={3}
            maxLength={2000}
            placeholder="Nova coluna de revisão, automação de prazo…"
            value={changelog}
            onChange={(event) => setChangelog(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            disabled={publishMutation.isPending}
            onClick={() =>
              publishMutation.mutate(
                { ...toSnapshotRequest(options), changelog: changelog.trim() || undefined },
                { onSuccess: () => onOpenChange(false) }
              )
            }
          >
            {publishMutation.isPending ? <Loader2 className="animate-spin" /> : null}
            Publicar versão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TemplateVersionsCard({ templateId }: { templateId: string }) {
  const versionsQuery = useTemplateVersionsQuery(templateId);
  const versions = versionsQuery.data ?? [];

  // A template with a single version has no history worth a card.
  if (!versionsQuery.isLoading && versions.length <= 1) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-4" aria-hidden /> Versões
        </CardTitle>
        <CardDescription>
          Quem usar o modelo recebe sempre a versão atual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {versionsQuery.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <ol className="divide-y divide-border/60">
            {versions.map((version) => (
              <li key={version.version} className="space-y-0.5 py-2 text-sm">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">Versão {version.version}</span>
                  {version.isCurrent ? <Badge variant="secondary">Atual</Badge> : null}
                  <span className="text-xs text-muted-foreground">{formatDate(version.createdAt)}</span>
                </p>
                {version.changelog ? (
                  <p className="whitespace-pre-line text-xs text-muted-foreground">{version.changelog}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
