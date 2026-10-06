"use client";

import * as React from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TemplateImage } from "@/features/folder-templates/components/template-image";
import { useTemplateMediaMutation } from "@/features/folder-templates/hooks/use-folder-templates";
import type { FolderTemplateSummary } from "@/types/folder-template";

const MAX_SCREENSHOTS = 6;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

// The server checks the real type by its bytes; this only spares a round trip.
function checkImage(file: File) {
  if (!ACCEPT.split(",").includes(file.type)) {
    toast.error("Use uma imagem JPEG, PNG ou WebP.");
    return false;
  }
  if (file.size > MAX_BYTES) {
    toast.error("A imagem pode ter até 5MB.");
    return false;
  }
  return true;
}

function PickImageButton({
  label,
  disabled,
  onPick,
}: {
  label: string;
  disabled?: boolean;
  onPick: (file: File) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file && checkImage(file)) onPick(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus /> {label}
      </Button>
    </>
  );
}

/** Cover and up to 6 screenshots. `admin` goes through the SUPER_ADMIN routes. */
export function TemplateMediaManager({
  template,
  admin = false,
}: {
  template: FolderTemplateSummary;
  admin?: boolean;
}) {
  const mediaMutation = useTemplateMediaMutation(template.id, admin);
  const busy = mediaMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Capa</p>
        {template.hasCover ? (
          <TemplateImage
            template={template}
            image="cover"
            alt="Capa do modelo"
            className="aspect-[16/7] w-full max-w-md rounded-lg"
          />
        ) : (
          <p className="text-xs text-muted-foreground">Sem capa. Ela aparece no cartão do modelo.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <PickImageButton
            label={template.hasCover ? "Trocar capa" : "Adicionar capa"}
            disabled={busy}
            onPick={(file) => mediaMutation.mutate({ kind: "setCover", file })}
          />
          {template.hasCover ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => mediaMutation.mutate({ kind: "removeCover" })}
            >
              <Trash2 /> Remover capa
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Imagens ({template.screenshotCount}/{MAX_SCREENSHOTS})
        </p>
        {template.screenshotCount > 0 ? (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Array.from({ length: template.screenshotCount }).map((_, index) => (
              <li key={index} className="group relative">
                <TemplateImage
                  template={template}
                  image={index}
                  alt={`Imagem ${index + 1}`}
                  className="aspect-video w-full rounded-md"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  aria-label={`Remover imagem ${index + 1}`}
                  disabled={busy}
                  className="absolute top-1 right-1"
                  onClick={() => mediaMutation.mutate({ kind: "removeScreenshot", index })}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <PickImageButton
          label="Adicionar imagem"
          disabled={busy || template.screenshotCount >= MAX_SCREENSHOTS}
          onPick={(file) => mediaMutation.mutate({ kind: "addScreenshot", file })}
        />
      </div>
      {busy ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Enviando…
        </p>
      ) : null}
    </div>
  );
}
