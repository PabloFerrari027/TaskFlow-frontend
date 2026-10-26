import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        // Wraps instead of squeezing: with many actions (a folder has six) the
        // buttons used to take the whole row and crush the title and description
        // into one word per line. The title keeps at least ~18rem; the buttons
        // drop below it when they do not fit beside it.
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-4",
        className
      )}
    >
      <div className="min-w-0 flex-[1_1_18rem] space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem] sm:leading-9">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
