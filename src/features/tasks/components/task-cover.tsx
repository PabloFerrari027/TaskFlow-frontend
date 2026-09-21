"use client";

import * as React from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  ACCEPTED_COVER_TYPES,
  MAX_COVER_SIZE_BYTES,
} from "@/features/tasks/api/tasks-service";
import {
  useRemoveTaskCoverMutation,
  useSetTaskCoverMutation,
  useTaskCoverUrl,
} from "@/features/tasks/hooks/use-tasks";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

/** Cover strip at the top of a board card; renders nothing for tasks without one. */
export function TaskCardCover({ task }: { task: Task }) {
  const coverUrl = useTaskCoverUrl(task);
  if (!task.hasCover) return null;

  return (
    // Bleeds over the card's padding so the image touches its edges.
    <div className="-mx-3.5 -mt-3.5 overflow-hidden rounded-t-lg bg-muted">
      {coverUrl ? (
        // Natural aspect ratio; only very tall images hit the max height and
        // get their overflow cropped (never distorted).
        // eslint-disable-next-line @next/next/no-img-element -- authenticated blob URL, not optimizable by next/image
        <img
          src={coverUrl}
          alt=""
          // The card itself is the drag source; a draggable <img> would start a
          // native image drag instead.
          draggable={false}
          className="block max-h-44 w-full object-cover"
        />
      ) : (
        <div className="h-28 animate-pulse" />
      )}
    </div>
  );
}

/** Full-width cover on the task detail, with add / replace / remove actions. */
export function TaskCoverBanner({ task }: { task: Task }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const coverUrl = useTaskCoverUrl(task);
  const setMutation = useSetTaskCoverMutation(task.id);
  const removeMutation = useRemoveTaskCoverMutation(task.id);

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    // The server decides by file content; this only spares a round trip.
    if (!ACCEPTED_COVER_TYPES.includes(file.type)) {
      toast.error("Use uma imagem JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_COVER_SIZE_BYTES) {
      toast.error("A imagem excede o limite de 10MB.");
      return;
    }

    setMutation.mutate(file);
  }

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={ACCEPTED_COVER_TYPES.join(",")}
      className="hidden"
      onChange={handleFileSelected}
    />
  );

  if (!task.hasCover) {
    return (
      <div>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          disabled={setMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {setMutation.isPending ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          Adicionar capa
        </Button>
        {fileInput}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex justify-center overflow-hidden rounded-xl border border-border/60 bg-muted",
        !coverUrl && "h-40 animate-pulse"
      )}
    >
      {coverUrl ? (
        // Shown whole, at its own aspect ratio: `object-contain` letterboxes
        // on the muted background instead of stretching or cropping.
        // eslint-disable-next-line @next/next/no-img-element -- authenticated blob URL, not optimizable by next/image
        <img
          src={coverUrl}
          alt="Capa da tarefa"
          className="block max-h-80 w-auto max-w-full object-contain"
        />
      ) : null}

      <div className="absolute right-3 bottom-3 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={setMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {setMutation.isPending ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          Trocar capa
        </Button>
        <ConfirmDialog
          trigger={
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label="Remover capa"
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Trash2 className="text-destructive" />
              )}
            </Button>
          }
          title="Remover capa"
          description="A imagem será apagada permanentemente. Esta ação não pode ser desfeita."
          confirmLabel="Remover"
          isLoading={removeMutation.isPending}
          onConfirm={() => removeMutation.mutate()}
        />
      </div>
      {fileInput}
    </div>
  );
}
