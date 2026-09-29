import type * as React from "react";
import { cn } from "cn";

/**
 * A select option as a pill. The color only tints the background, border and
 * dot — the label keeps `foreground`, so any palette color stays legible on
 * both themes.
 */
export function OptionChip({
  label,
  color,
  className,
}: {
  label: React.ReactNode;
  color: string | null | undefined;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 max-w-full shrink-0 items-center gap-1.5 rounded-full border px-2 text-xs font-medium text-foreground",
        !color && "border-border bg-muted",
        className
      )}
      style={
        color
          ? {
              backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
              borderColor: `color-mix(in srgb, ${color} 38%, transparent)`,
            }
          : undefined
      }
    >
      {color ? (
        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      ) : null}
      <span className="truncate">{label}</span>
    </span>
  );
}
