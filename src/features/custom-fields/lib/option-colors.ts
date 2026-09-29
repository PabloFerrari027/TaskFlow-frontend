import type { CustomFieldDefinition } from "@/types/custom-field";

/**
 * Colors a select option can take. Saturated mid tones (Tailwind 500) that sit
 * next to the indigo primary without clashing, and read on both themes —
 * chips only tint their background with them, the text stays `foreground`.
 * The API stores `#RRGGBB`, so these are hex, not theme tokens — never change
 * one, saved options point at it. Ordered by hue. The backend's system
 * templates color their options with these (seed-templates.migration.spec.ts
 * keeps a copy of the list).
 *
 * No yellow or cyan: at the chip's 14% tint they can't be told apart from
 * amber and from teal/sky.
 */
export const OPTION_COLOR_PALETTE = [
  { name: "Cinza", hex: "#71717A" },
  { name: "Vermelho", hex: "#EF4444" },
  { name: "Laranja", hex: "#F97316" },
  { name: "Âmbar", hex: "#F59E0B" },
  // Fills the amber -> green gap: the step between "neutral" and "good" in
  // 5-level scales, and "fresh start" (beginner, spring, new user).
  { name: "Lima", hex: "#84CC16" },
  { name: "Verde", hex: "#10B981" },
  { name: "Turquesa", hex: "#14B8A6" },
  { name: "Azul", hex: "#0EA5E9" },
  { name: "Índigo", hex: "#6366F1" },
  { name: "Violeta", hex: "#8B5CF6" },
  // Fills the violet -> pink gap: vivid/festive, and one more hue for fields
  // with many options (months).
  { name: "Fúcsia", hex: "#D946EF" },
  { name: "Rosa", hex: "#EC4899" },
] as const;

// Order new options are colored in: starts at the brand indigo and walks the
// wheel, leaving grey out so fresh options never look "disabled". The first
// nine keep their original order; lime and fuchsia come last.
const AUTO_COLOR_ORDER = [8, 5, 3, 1, 7, 9, 2, 6, 11, 4, 10].map((i) => OPTION_COLOR_PALETTE[i].hex);

/** Color suggested for the option at `index` when the user hasn't picked one. */
export function suggestOptionColor(index: number): string {
  return AUTO_COLOR_ORDER[index % AUTO_COLOR_ORDER.length];
}

export function getOptionColorName(hex: string | null | undefined): string {
  if (!hex) return "Sem cor";
  return (
    OPTION_COLOR_PALETTE.find((color) => color.hex.toLowerCase() === hex.toLowerCase())?.name ??
    "Personalizada"
  );
}

export function getOptionColor(
  definition: Pick<CustomFieldDefinition, "optionColors">,
  option: string
): string | null {
  return definition.optionColors?.[option] ?? null;
}

/**
 * Builds the `optionColors` map the API expects from edited rows: blank
 * options and uncolored ones are left out, and an empty map becomes `null`.
 */
export function buildOptionColors(
  rows: { value: string; color: string | null }[]
): Record<string, string> | null {
  const entries = rows
    .map((row) => [row.value.trim(), row.color] as const)
    .filter((entry): entry is readonly [string, string] => Boolean(entry[0] && entry[1]));
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}
