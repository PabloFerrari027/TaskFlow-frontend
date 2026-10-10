import { cn } from "@/lib/utils";

/** Swaps between two labels (e.g. "Copiar" ↔ "Copiado") without changing the
 *  button's width: both sit in the same grid cell, sized by the wider one, and
 *  only one is visible — so the buttons around it don't shift on click. */
export function SwapLabel({
  active,
  label,
  activeLabel,
}: {
  active: boolean;
  label: string;
  activeLabel: string;
}) {
  return (
    <span className="inline-grid">
      <span className={cn("col-start-1 row-start-1", active && "invisible")}>{label}</span>
      <span className={cn("col-start-1 row-start-1", !active && "invisible")}>{activeLabel}</span>
    </span>
  );
}
