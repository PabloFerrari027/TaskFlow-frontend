"use client";

import { useTemplateImageUrl } from "@/features/project-templates/hooks/use-project-templates";
import { cn } from "@/lib/utils";
import type { ProjectTemplateSummary } from "@/types/project-template";

type ImageSource = Pick<ProjectTemplateSummary, "id" | "updatedAt" | "hasCover" | "screenshotCount">;

/** A template's cover or screenshot (behind auth, so fetched as a Blob). */
export function TemplateImage({
  template,
  image,
  alt,
  className,
}: {
  template: ImageSource;
  image: "cover" | number;
  alt: string;
  className?: string;
}) {
  const url = useTemplateImageUrl(template, image);
  if (!url) return <div className={cn("animate-pulse bg-muted", className)} aria-hidden />;
  // Object URLs can't go through next/image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={cn("object-cover", className)} />;
}
