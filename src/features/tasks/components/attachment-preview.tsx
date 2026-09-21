"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  File as FileIcon,
  FileText,
  Film,
  ImageIcon,
  Loader2,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { useAttachmentFileQuery } from "@/features/tasks/hooks/use-tasks";
import type { Attachment } from "@/types/task";

type PreviewKind = "image" | "pdf" | "video" | "audio" | "text" | "none";

const MAX_TEXT_PREVIEW_CHARS = 100_000;

export function getPreviewKind(attachment: Pick<Attachment, "mimeType" | "fileName">): PreviewKind {
  const mime = attachment.mimeType.toLowerCase();
  if (mime.startsWith("image/") && mime !== "image/svg+xml") return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/xml"
  ) {
    return "text";
  }
  return "none";
}

const KIND_ICON = {
  image: ImageIcon,
  pdf: FileText,
  video: Film,
  audio: Music,
  text: FileText,
  none: FileIcon,
} satisfies Record<PreviewKind, React.ComponentType<{ className?: string }>>;

/** Small leading visual for a list row: real thumbnail for images, kind icon otherwise. */
export function AttachmentThumbnail({
  taskId,
  attachment,
}: {
  taskId: string;
  attachment: Attachment;
}) {
  const kind = getPreviewKind(attachment);
  const file = useAttachmentFileQuery(taskId, attachment, { enabled: kind === "image" });
  const Icon = KIND_ICON[kind];

  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted text-muted-foreground">
      {kind === "image" && file.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- authenticated blob URL, not optimizable by next/image
        <img src={file.url} alt="" className="size-full object-cover" />
      ) : (
        <Icon className="size-4" />
      )}
    </div>
  );
}

function TextPreview({ blob }: { blob: Blob }) {
  const [text, setText] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    blob
      .slice(0, MAX_TEXT_PREVIEW_CHARS)
      .text()
      .then((value) => {
        if (!cancelled) setText(value);
      });
    return () => {
      cancelled = true;
    };
  }, [blob]);

  if (text === null) return <Loader2 className="size-5 animate-spin text-muted-foreground" />;

  return (
    <pre className="size-full overflow-auto whitespace-pre-wrap break-words p-4 text-left font-mono text-xs text-foreground">
      {text}
      {blob.size > MAX_TEXT_PREVIEW_CHARS ? "\n\n… (arquivo truncado, baixe para ver completo)" : ""}
    </pre>
  );
}

function PreviewBody({ taskId, attachment }: { taskId: string; attachment: Attachment }) {
  const kind = getPreviewKind(attachment);
  const file = useAttachmentFileQuery(taskId, attachment, { enabled: kind !== "none" });

  if (kind === "none") {
    return (
      <p className="px-6 text-center text-sm text-muted-foreground">
        Este tipo de arquivo não tem preview. Use o botão de download para abri-lo.
      </p>
    );
  }
  if (file.isError) {
    return (
      <p className="px-6 text-center text-sm text-destructive">
        Não foi possível carregar o preview.
      </p>
    );
  }
  if (file.isLoading || !file.url || !file.blob) {
    return <Loader2 className="size-5 animate-spin text-muted-foreground" />;
  }

  switch (kind) {
    case "image":
      // eslint-disable-next-line @next/next/no-img-element -- authenticated blob URL
      return <img src={file.url} alt={attachment.fileName} className="max-h-full max-w-full object-contain" />;
    case "pdf":
      return <iframe src={file.url} title={attachment.fileName} className="size-full border-0" />;
    case "video":
      return <video src={file.url} controls className="max-h-full max-w-full" />;
    case "audio":
      return <audio src={file.url} controls className="w-full max-w-md" />;
    case "text":
      return <TextPreview blob={file.blob} />;
  }
}

export function AttachmentPreviewDialog({
  taskId,
  attachments,
  index,
  onIndexChange,
  onClose,
  onDownload,
  isDownloading,
}: {
  taskId: string;
  attachments: Attachment[];
  /** Index of the attachment being previewed, or `null` when closed. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onDownload: (attachment: Attachment) => void;
  isDownloading: boolean;
}) {
  const attachment = index !== null ? attachments[index] : undefined;
  const hasMultiple = attachments.length > 1;

  const go = React.useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndexChange((index + delta + attachments.length) % attachments.length);
    },
    [index, attachments.length, onIndexChange]
  );

  return (
    <Dialog open={!!attachment} onOpenChange={(open) => !open && onClose()}>
      {attachment ? (
        <DialogContent
          className="sm:max-w-4xl"
          onKeyDown={(event) => {
            if (!hasMultiple) return;
            if (event.key === "ArrowLeft") go(-1);
            if (event.key === "ArrowRight") go(1);
          }}
        >
          <DialogHeader className="pr-8">
            <DialogTitle className="truncate">{attachment.fileName}</DialogTitle>
            <DialogDescription>
              {formatFileSize(attachment.size)} · {formatDateTime(attachment.uploadedAt)}
              {hasMultiple ? ` · ${(index ?? 0) + 1} de ${attachments.length}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex h-[65vh] items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/40">
            {/* key resets per-attachment state (text, loading) when navigating */}
            <PreviewBody key={attachment.id} taskId={taskId} attachment={attachment} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {hasMultiple ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => go(-1)}>
                    <ChevronLeft />
                    Anterior
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => go(1)}>
                    Próximo
                    <ChevronRight />
                  </Button>
                </>
              ) : null}
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isDownloading}
              onClick={() => onDownload(attachment)}
            >
              {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
              Baixar
            </Button>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
