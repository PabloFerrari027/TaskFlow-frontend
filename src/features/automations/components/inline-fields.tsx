"use client";

import * as React from "react";
import { ChevronDown, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PickerOption, AutomationLookups } from "@/features/automations/hooks/use-automation-lookups";
import {
  eventFieldsForKind,
  type ActionParamSpec,
  type TriggerEventSpec,
} from "@/features/automations/lib/automation-catalog";
import { eventValueText, type ParamDraft } from "@/features/automations/lib/automation-draft";
import { cn } from "@/lib/utils";

// Above this many options a plain list stops being scannable — show a search box.
const SEARCH_THRESHOLD = 6;

/** The pill-shaped control that sits inside the sentence and opens a picker. */
export function InlineChip({
  empty,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { empty?: boolean }) {
  return (
    <button
      type="button"
      data-empty={empty || undefined}
      className={cn(
        "inline-flex h-7 max-w-full items-center gap-1 rounded-md border border-border bg-muted/60 px-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50 data-[empty=true]:border-dashed data-[empty=true]:border-amber-500/70 data-[empty=true]:bg-amber-500/5 data-[empty=true]:font-normal data-[empty=true]:text-muted-foreground",
        className
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      <ChevronDown className="size-3 shrink-0 opacity-50" />
    </button>
  );
}

function groupOptions(options: PickerOption[]) {
  const groups: { heading?: string; options: PickerOption[] }[] = [];
  for (const option of options) {
    const last = groups[groups.length - 1];
    if (last && last.heading === option.group) last.options.push(option);
    else groups.push({ heading: option.group, options: [option] });
  }
  return groups;
}

function OptionCommand({
  options,
  selected,
  onSelect,
  placeholder = "Buscar…",
  emptyText = "Nada encontrado.",
}: {
  options: PickerOption[];
  selected: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
}) {
  return (
    <Command>
      {options.length > SEARCH_THRESHOLD ? <CommandInput placeholder={placeholder} /> : null}
      <CommandList>
        <CommandEmpty>{emptyText}</CommandEmpty>
        {groupOptions(options).map((group, index) => (
          <CommandGroup key={group.heading ?? index} heading={group.heading}>
            {group.options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                keywords={[option.label, option.group ?? "", ...(option.keywords ?? [])]}
                data-checked={selected.includes(option.value)}
                onSelect={() => onSelect(option.value)}
              >
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}

const CONTENT_CLASS = "w-64 gap-0 p-0";

export function InlinePicker({
  value,
  options,
  onChange,
  placeholder,
  displayLabel,
  emptyText,
  ariaLabel,
}: {
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  placeholder: string;
  // For a value that isn't among `options` (e.g. a deleted section).
  displayLabel?: string;
  emptyText?: string;
  ariaLabel: string;
}) {
  const [open, setOpen] = React.useState(false);
  const label = options.find((option) => option.value === value)?.label ?? displayLabel;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <InlineChip empty={!value} aria-label={ariaLabel} aria-expanded={open}>
          {value ? (label ?? value) : placeholder}
        </InlineChip>
      </PopoverTrigger>
      <PopoverContent align="start" className={CONTENT_CLASS}>
        <OptionCommand
          options={options}
          selected={[value]}
          emptyText={emptyText}
          onSelect={(next) => {
            onChange(next);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function InlineMultiPicker({
  value,
  options,
  onChange,
  placeholder,
  labelFor,
  ariaLabel,
}: {
  value: string[];
  options: PickerOption[];
  onChange: (value: string[]) => void;
  placeholder: string;
  labelFor: (value: string) => string;
  ariaLabel: string;
}) {
  const [open, setOpen] = React.useState(false);
  const filled = value.filter((item) => item.trim() !== "");

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <InlineChip empty={filled.length === 0} aria-label={ariaLabel} aria-expanded={open}>
          {filled.length === 0 ? placeholder : filled.map(labelFor).join(", ")}
        </InlineChip>
      </PopoverTrigger>
      <PopoverContent align="start" className={CONTENT_CLASS}>
        <OptionCommand
          options={options}
          selected={filled}
          onSelect={(next) =>
            onChange(filled.includes(next) ? filled.filter((item) => item !== next) : [...filled, next])
          }
        />
      </PopoverContent>
    </Popover>
  );
}

export function InlineTextField({
  value,
  onChange,
  placeholder,
  hint,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint?: string;
  ariaLabel: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <InlineChip empty={value.trim() === ""} aria-label={ariaLabel} aria-expanded={open}>
          {value.trim() === "" ? placeholder : value}
        </InlineChip>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-1.5 p-2">
        <Input
          autoFocus
          value={value}
          placeholder={placeholder}
          aria-label={ariaLabel}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") setOpen(false);
          }}
        />
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </PopoverContent>
    </Popover>
  );
}

/**
 * One parameter of the action. The default — and what almost every rule
 * wants — is a fixed value. "Valor do evento" (the `{{payload.FIELD}}`
 * placeholder) lives behind a second tab so nobody has to know it exists to
 * build a rule, and nobody types the placeholder syntax by hand.
 */
export function ParamValueField({
  param,
  draft,
  onChange,
  event,
  lookups,
}: {
  param: ActionParamSpec;
  draft: ParamDraft;
  onChange: (next: ParamDraft) => void;
  event: TriggerEventSpec | undefined;
  lookups: AutomationLookups;
}) {
  const [open, setOpen] = React.useState(false);
  const fixedOptions = lookups.optionsFor(param.kind);
  const eventOptions: PickerOption[] = eventFieldsForKind(event, param.kind).map((field) => ({
    value: field.field,
    label: eventValueText(field.field, event),
  }));

  const isEmpty = draft.mode === "event" ? draft.eventField === "" : draft.value.trim() === "";
  const chipLabel =
    draft.mode === "event"
      ? draft.eventField
        ? eventValueText(draft.eventField, event)
        : "valor do evento"
      : draft.value.trim() === ""
        ? param.label
        : lookups.labelFor(param.kind, draft.value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <InlineChip empty={isEmpty} aria-label={param.label} aria-expanded={open}>
          {draft.mode === "event" ? <Zap className="mr-0.5 inline size-3 text-amber-600" /> : null}
          {chipLabel}
        </InlineChip>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 gap-0 p-0">
        <Tabs
          value={draft.mode}
          onValueChange={(mode) => onChange({ ...draft, mode: mode as ParamDraft["mode"] })}
          className="gap-0"
        >
          <TabsList className="m-2 w-auto">
            <TabsTrigger value="fixed">Valor fixo</TabsTrigger>
            <TabsTrigger value="event">Valor do evento</TabsTrigger>
          </TabsList>

          <TabsContent value="fixed">
            {fixedOptions ? (
              <OptionCommand
                options={fixedOptions}
                selected={[draft.value]}
                onSelect={(value) => {
                  onChange({ ...draft, mode: "fixed", value });
                  setOpen(false);
                }}
              />
            ) : (
              <div className="p-2 pt-0">
                <Input
                  autoFocus
                  value={draft.value}
                  placeholder={param.label}
                  aria-label={param.label}
                  onChange={(e) => onChange({ ...draft, mode: "fixed", value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setOpen(false);
                  }}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="event">
            {eventOptions.length > 0 ? (
              <>
                <p className="px-3 pb-1 text-xs text-muted-foreground">
                  Usa o valor que o próprio evento trouxe, na hora em que a regra rodar.
                </p>
                <OptionCommand
                  options={eventOptions}
                  selected={[draft.eventField]}
                  onSelect={(eventField) => {
                    onChange({ ...draft, mode: "event", eventField });
                    setOpen(false);
                  }}
                />
              </>
            ) : (
              <p className="px-3 pb-3 text-xs text-muted-foreground">
                Este evento não traz nenhum valor compatível com este campo.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
