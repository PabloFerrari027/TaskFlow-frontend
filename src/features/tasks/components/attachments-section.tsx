"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, Loader2, Paperclip, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatFileSize, formatDateTime } from "@/lib/format";
import {
  MAX_ATTACHMENT_SIZE_BYTES,
} from "@/features/tasks/api/tasks-service";
import {
  useDownloadAttachmentMutation,
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
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

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
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 px-3 py-2.5 text-sm"
            >
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{attachment.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)} · {formatDateTime(attachment.uploadedAt)}
                </p>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={downloadMutation.isPending && downloadingId === attachment.id}
                onClick={() => {
                  setDownloadingId(attachment.id);
                  downloadMutation.mutate(
                    { attachmentId: attachment.id, fileName: attachment.fileName },
                    { onSettled: () => setDownloadingId(null) }
                  );
                }}
              >
                {downloadMutation.isPending && downloadingId === attachment.id ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Download />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
