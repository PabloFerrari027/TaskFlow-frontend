"use client";

import * as React from "react";
import { Ban, Check } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  OPTION_COLOR_PALETTE,
  getOptionColorName,
} from "@/features/custom-fields/lib/option-colors";

function isSameColor(a: string | null, b: string | null) {
  return (a ?? "").toLowerCase() === (b ?? "").toLowerCase();
}

/** Swatch button that opens the option palette; `null` means no color. */
export function OptionColorPicker({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (color: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  function pick(color: string | null) {
    onChange(color);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          aria-label={`Cor da opção: ${getOptionColorName(value)}`}
          title={`Cor: ${getOptionColorName(value)}`}
        >
          <span
            className={cn(
              "size-4 rounded-full",
              value ? "ring-1 ring-black/10 ring-inset" : "border border-dashed border-muted-foreground/60"
            )}
            style={value ? { backgroundColor: value } : undefined}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-2 p-3">
        <p className="text-xs font-medium text-muted-foreground">Cor da opção</p>
        <div className="grid grid-cols-6 gap-2">
          {OPTION_COLOR_PALETTE.map((color) => {
            const selected = isSameColor(value, color.hex);
            return (
              <button
                key={color.hex}
                type="button"
                aria-label={color.name}
                aria-pressed={selected}
                title={color.name}
                onClick={() => pick(color.hex)}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
                  selected && "ring-2 ring-offset-2 ring-offset-popover"
                )}
                style={{
                  backgroundColor: color.hex,
                  ...(selected ? { "--tw-ring-color": color.hex } : {}),
                } as React.CSSProperties}
              >
                {selected ? <Check className="size-3.5 text-white" strokeWidth={3} /> : null}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-pressed={value === null}
          onClick={() => pick(null)}
          className={cn(
            "flex items-center gap-2 rounded-md px-1.5 py-1 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            value === null && "text-foreground"
          )}
        >
          <Ban className="size-3.5" />
          Sem cor
          {value === null ? <Check className="ml-auto size-3.5" /> : null}
        </button>
      </PopoverContent>
    </Popover>
  );
}
