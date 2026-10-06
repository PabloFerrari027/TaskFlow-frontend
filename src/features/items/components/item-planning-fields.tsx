"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import { useUpdateItemMutation } from "@/features/items/hooks/use-items";
import type { Item } from "@/types/item";

/** Start date (optional, clearable, never after the due date) and the milestone switch. */
export function ItemScheduleFields({
  item,
}: {
  item: Pick<Item, "id" | "startDate" | "dueDate" | "isMilestone">;
}) {
  const updateMutation = useUpdateItemMutation(item.id);
  const maxStart = item.dueDate ? toDateInputValue(item.dueDate) : undefined;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase">Começa em</p>
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={toDateInputValue(item.startDate)}
            max={maxStart}
            disabled={updateMutation.isPending}
            onChange={(e) => {
              if (!e.target.value) return;
              updateMutation.mutate({ startDate: fromDateInputValue(e.target.value) });
            }}
          />
          {item.startDate ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Tirar a data de início"
              title="Tirar a data de início"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate({ startDate: null })}
            >
              <X />
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Opcional. Com início e prazo, o item aparece como uma barra no Cronograma.
        </p>
      </div>

      <label className="flex items-start justify-between gap-3">
        <span>
          <span className="block text-sm font-medium">Marco</span>
          <span className="block text-xs text-muted-foreground">
            Um ponto importante, como uma entrega ou aprovação — não um período de trabalho.
          </span>
        </span>
        <Switch
          checked={item.isMilestone}
          disabled={updateMutation.isPending}
          onCheckedChange={(isMilestone) => updateMutation.mutate({ isMilestone })}
          aria-label="Marco"
        />
      </label>
    </div>
  );
}

function toParts(minutes: number | null) {
  if (minutes === null) return { hours: "", mins: "" };
  return { hours: String(Math.floor(minutes / 60)), mins: String(minutes % 60) };
}

/** How long it should take (hours + minutes) and, for teams that use them, effort points. */
export function ItemEstimateFields({
  item,
}: {
  item: Pick<Item, "id" | "estimateMinutes" | "storyPoints">;
}) {
  const updateMutation = useUpdateItemMutation(item.id);
  const [parts, setParts] = React.useState(() => toParts(item.estimateMinutes));
  const [points, setPoints] = React.useState(item.storyPoints?.toString() ?? "");

  function saveEstimate(next = parts) {
    const hours = Number(next.hours || 0);
    const mins = Number(next.mins || 0);
    if (!Number.isFinite(hours) || !Number.isFinite(mins) || hours < 0 || mins < 0) return;
    const total = next.hours === "" && next.mins === "" ? null : Math.round(hours * 60 + mins);
    if (total === item.estimateMinutes) return;
    updateMutation.mutate({ estimateMinutes: total });
  }

  function savePoints() {
    const value = points.trim() === "" ? null : Number(points.replace(",", "."));
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      setPoints(item.storyPoints?.toString() ?? "");
      return;
    }
    if (value === item.storyPoints) return;
    updateMutation.mutate({ storyPoints: value });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase">Tempo estimado</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            className="w-20"
            aria-label="Horas"
            value={parts.hours}
            onChange={(e) => setParts((p) => ({ ...p, hours: e.target.value }))}
            onBlur={() => saveEstimate()}
          />
          <span className="text-sm text-muted-foreground">h</span>
          <Input
            type="number"
            min={0}
            max={59}
            inputMode="numeric"
            className="w-20"
            aria-label="Minutos"
            value={parts.mins}
            onChange={(e) => setParts((p) => ({ ...p, mins: e.target.value }))}
            onBlur={() => saveEstimate()}
          />
          <span className="text-sm text-muted-foreground">min</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase">Pontos de esforço</p>
        <Input
          type="text"
          inputMode="decimal"
          className="w-24"
          placeholder="—"
          aria-label="Pontos de esforço"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          onBlur={savePoints}
        />
        <p className="text-xs text-muted-foreground">
          Opcional — para equipes que medem o tamanho dos itens em pontos.
        </p>
      </div>
    </div>
  );
}
