import Link from "next/link";
import { Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string | null;
}) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-base font-semibold tracking-tight text-foreground",
        className
      )}
    >
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Workflow className="size-4" />
      </span>
      TaskFlow
    </span>
  );

  if (!href) return content;

  return <Link href={href}>{content}</Link>;
}
