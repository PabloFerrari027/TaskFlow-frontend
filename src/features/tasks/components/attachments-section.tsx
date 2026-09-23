"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, ExternalLink, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AttachmentPreviewDialog,
  AttachmentThumbnail,
  canOpenInNewTab,
  useOpenAttachmentInNewTab,
} from "@/features/tasks/components/attachment-preview";
import { formatFileSize, formatDateTime } from "@/lib/format";
import {
  MAX_ATTACHMENT_SIZE_BYTES,
} from "@/features/tasks/api/tasks-service";
import {
  useDownloadAttachmentMutation,
  useRemoveAttachmentMutation,
  useUploadAttachmentMutation,
} from "@/features/tasks/hooks/use-tasks";
import type { Attachment } from "@/types/task";

export function AttachmentsSection({
  taskId,
  attachments,
}: {
  taskId: string;
  attachments: Attachment[];
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadAttachmentMutation(taskId);
  const downloadMutation = useDownloadAttachmentMutation(taskId);
  const removeMutation = useRemoveAttachmentMutation(taskId);
  const { open: openInNewTab, openingId } = useOpenAttachmentInNewTab(taskId);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);

  const isDownloading = (attachmentId: string | undefined) =>
    downloadMutation.isPending && downloadingId === attachmentId;

  const isRemoving = (attachmentId: string) =>
    removeMutation.isPending && removingId === attachmentId;

  function download(attachment: Attachment) {
    setDownloadingId(attachment.id);
    downloadMutation.mutate(
      { attachmentId: attachment.id, fileName: attachment.fileName },
      { onSettled: () => setDownloadingId(null) }
    );
  }

  function remove(attachment: Attachment) {
    setRemovingId(attachment.id);
    removeMutation.mutate(attachment.id, {
      onSettled: () => setRemovingId(null),
    });
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      toast.error("O arquivo excede o limite de 20MB.");
      return;
    }

    uploadMutation.mutate(file);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Anexos</h3>
        <Button
          size="sm"
          variant="outline"
          disabled={uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
          Enviar arquivo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {attachments.length === 0 ? (
        <EmptyState icon={<Paperclip className="size-5" />} title="Nenhum anexo" />
      ) : (
        <div className="divide-y divide-border/60 rounded-lg border border-border/60">
          {attachments.map((attachment, index) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 px-3 py-2.5 text-sm"
            >
              <button
                type="button"
                aria-label={`Visualizar ${attachment.fileName}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setPreviewIndex(index)}
              >
                <AttachmentThumbnail taskId={taskId} attachment={attachment} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{attachment.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)} · {formatDateTime(attachment.uploadedAt)}
                  </p>
                </div>
              </button>
              {canOpenInNewTab(attachment) ? (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Abrir ${attachment.fileName} em nova aba`}
                  title="Abrir em nova aba"
                  disabled={openingId === attachment.id}
                  onClick={() => openInNewTab(attachment)}
                >
                  {openingId === attachment.id ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ExternalLink />
                  )}
                </Button>
              ) : null}
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Baixar ${attachment.fileName}`}
                disabled={isDownloading(attachment.id)}
                onClick={() => download(attachment)}
              >
                {isDownloading(attachment.id) ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Download />
                )}
              </Button>
              <ConfirmDialog
                trigger={
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remover ${attachment.fileName}`}
                    disabled={isRemoving(attachment.id)}
                  >
                    {isRemoving(attachment.id) ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 className="text-destructive" />
                    )}
                  </Button>
                }
                title="Remover anexo"
                description={`"${attachment.fileName}" será apagado permanentemente. Esta ação não pode ser desfeita.`}
                confirmLabel="Remover"
                isLoading={isRemoving(attachment.id)}
                onConfirm={() => remove(attachment)}
              />
            </div>
          ))}
        </div>
      )}

      <AttachmentPreviewDialog
        taskId={taskId}
        attachments={attachments}
        index={previewIndex}
        onIndexChange={setPreviewIndex}
        onClose={() => setPreviewIndex(null)}
        onDownload={download}
        isDownloading={previewIndex !== null && isDownloading(attachments[previewIndex]?.id)}
        onOpenInNewTab={openInNewTab}
        isOpeningInNewTab={previewIndex !== null && openingId === attachments[previewIndex]?.id}
      />
    </div>
  );
}
