import { cn } from "@/lib/utils";

const METHOD_CLASS: Record<string, string> = {
  GET: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  POST: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  PATCH: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PUT: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  DELETE: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-16 shrink-0 items-center justify-center rounded-md py-1 font-mono text-[11px] font-bold tracking-wide",
        METHOD_CLASS[method] ?? "bg-muted text-muted-foreground"
      )}
    >
      {method}
    </span>
  );
}

export function statusToneClass(status: number) {
  if (status < 300) return "text-emerald-600 dark:text-emerald-400";
  if (status < 400) return "text-sky-600 dark:text-sky-400";
  if (status < 500) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}
