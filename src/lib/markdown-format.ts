/**
 * Pure text edits behind the description formatting toolbar and its keyboard
 * shortcuts. Each one takes the text and the selection and returns the new
 * text and selection, so the textarea can apply them (see `MarkdownTextarea`).
 */
export type MarkdownAction =
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "link"
  | "heading"
  | "quote"
  | "bullet"
  | "numbered"
  | "task";

export interface TextEdit {
  value: string;
  start: number;
  end: number;
}

const WRAPPERS: Partial<Record<MarkdownAction, { marker: string; placeholder: string }>> = {
  bold: { marker: "**", placeholder: "negrito" },
  italic: { marker: "_", placeholder: "itálico" },
  strike: { marker: "~~", placeholder: "tachado" },
  code: { marker: "`", placeholder: "código" },
};

interface LinePrefix {
  strip: RegExp;
  replace: RegExp;
  add: (index: number) => string;
}

// `strip` matches the action's own prefix, so applying it again toggles it off.
// `replace` is what gets removed before adding it: the three list kinds swap
// into each other instead of stacking ("- - [ ] x"), and headings swap level.
const ANY_LIST = /^(?:[-*] (?:\[[ xX]\] )?|\d+\. )/;

function linePrefix(action: MarkdownAction, level: number): LinePrefix | null {
  switch (action) {
    case "heading":
      return {
        strip: new RegExp(`^#{${level}} `),
        replace: /^#{1,6} /,
        add: () => `${"#".repeat(level)} `,
      };
    case "quote":
      return { strip: /^> ?/, replace: /^> ?/, add: () => "> " };
    case "bullet":
      return { strip: /^[-*] (?!\[[ xX]\] )/, replace: ANY_LIST, add: () => "- " };
    case "numbered":
      return { strip: /^\d+\. /, replace: ANY_LIST, add: (i) => `${i + 1}. ` };
    case "task":
      return { strip: /^[-*] \[[ xX]\] /, replace: ANY_LIST, add: () => "- [ ] " };
    default:
      return null;
  }
}

function wrap(value: string, start: number, end: number, marker: string, placeholder: string) {
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);

  // Marker sits just outside the selection → take it off.
  if (before.endsWith(marker) && after.startsWith(marker) && selected) {
    return {
      value: before.slice(0, -marker.length) + selected + after.slice(marker.length),
      start: start - marker.length,
      end: end - marker.length,
    };
  }
  // Marker is inside the selection → take it off.
  if (
    selected.length >= marker.length * 2 &&
    selected.startsWith(marker) &&
    selected.endsWith(marker)
  ) {
    const inner = selected.slice(marker.length, -marker.length);
    return { value: before + inner + after, start, end: start + inner.length };
  }

  const text = selected || placeholder;
  return {
    value: before + marker + text + marker + after,
    start: start + marker.length,
    end: start + marker.length + text.length,
  };
}

/** Whole lines touched by the selection: `[from, to)` and their text. */
function lineRange(value: string, start: number, end: number) {
  const from = value.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = value.indexOf("\n", end);
  const to = nextBreak === -1 ? value.length : nextBreak;
  return { from, to, lines: value.slice(from, to).split("\n") };
}

function prefixLines(value: string, start: number, end: number, { strip, replace, add }: LinePrefix) {
  const { from, to, lines } = lineRange(value, start, end);
  const filled = lines.filter((line) => line.trim());
  const allPrefixed = filled.length > 0 && filled.every((line) => strip.test(line));

  let index = 0;
  const next = lines
    .map((line) => {
      if (allPrefixed) return line.replace(strip, "");
      if (!line.trim()) return line;
      return add(index++) + line.replace(replace, "");
    })
    .join("\n");

  return { value: value.slice(0, from) + next + value.slice(to), start: from, end: from + next.length };
}

function link(value: string, start: number, end: number, url = "https://") {
  const selected = value.slice(start, end);
  const text = selected || "texto";
  const inserted = `[${text}](${url})`;
  const urlStart = start + text.length + 3; // past `[text](`
  return {
    value: value.slice(0, start) + inserted + value.slice(end),
    start: urlStart,
    end: urlStart + url.length,
  };
}

export function applyMarkdownAction(
  action: MarkdownAction,
  value: string,
  start: number,
  end: number,
  options: { level?: 1 | 2 | 3 } = {},
): TextEdit {
  const wrapper = WRAPPERS[action];
  if (wrapper) return wrap(value, start, end, wrapper.marker, wrapper.placeholder);

  const prefix = linePrefix(action, options.level ?? 2);
  if (prefix) return prefixLines(value, start, end, prefix);

  return link(value, start, end);
}

/** Pasting a URL over selected text turns the selection into a link to it. */
export function linkSelectionToUrl(
  value: string,
  start: number,
  end: number,
  url: string,
): TextEdit | null {
  if (start === end || !/^https?:\/\/\S+$/i.test(url.trim())) return null;
  const selected = value.slice(start, end);
  const inserted = `[${selected}](${url.trim()})`;
  const caret = start + inserted.length;
  return { value: value.slice(0, start) + inserted + value.slice(end), start: caret, end: caret };
}

// indent · marker (quote, bullet / task, numbered) · rest of the line.
const LIST_LINE = /^(\s*)(>\s?|[-*] (?:\[[ xX]\] )?|\d+\. )(.*)$/;

function nextMarker(marker: string) {
  if (marker.startsWith(">")) return "> ";
  const numbered = /^(\d+)\. $/.exec(marker);
  if (numbered) return `${Number(numbered[1]) + 1}. `;
  if (/\[[ xX]\]/.test(marker)) return marker.replace(/\[[xX]\]/, "[ ]");
  return marker;
}

/**
 * Enter at the end of a list/quote line continues it with the next marker;
 * Enter on an empty one ends the list. Returns `null` when the caret isn't
 * at the end of such a line, so Enter keeps its normal behavior.
 */
export function continueList(value: string, caret: number): TextEdit | null {
  const lineStart = value.lastIndexOf("\n", caret - 1) + 1;
  const lineEndIdx = value.indexOf("\n", caret);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
  if (caret !== lineEnd) return null;

  const match = LIST_LINE.exec(value.slice(lineStart, lineEnd));
  if (!match) return null;
  const [, indent, marker, content] = match;

  if (!content.trim()) {
    return { value: value.slice(0, lineStart) + value.slice(lineEnd), start: lineStart, end: lineStart };
  }

  const inserted = `\n${indent}${nextMarker(marker)}`;
  const at = lineStart + indent.length + marker.length + content.length;
  const nextCaret = at + inserted.length;
  return { value: value.slice(0, at) + inserted + value.slice(at), start: nextCaret, end: nextCaret };
}

/**
 * Tab / Shift+Tab nests or un-nests the list lines in the selection. `null`
 * when none of them is a list line, so Tab keeps moving focus as usual.
 */
export function indentListLines(
  value: string,
  start: number,
  end: number,
  outdent: boolean,
): TextEdit | null {
  const { from, to, lines } = lineRange(value, start, end);
  if (!lines.some((line) => LIST_LINE.test(line))) return null;

  let firstDelta = 0;
  const next = lines.map((line, i) => {
    const match = LIST_LINE.exec(line);
    if (!match) return line;
    // A nested item must line up with its parent's text: 3 columns after `1. `.
    const unit = /^\d/.test(match[2]) ? 3 : 2;
    let result = line;
    if (outdent) {
      const remove = Math.min(unit, match[1].length);
      result = line.slice(remove);
      if (i === 0) firstDelta = -remove;
    } else {
      result = " ".repeat(unit) + line;
      if (i === 0) firstDelta = unit;
    }
    return result;
  });

  const joined = next.join("\n");
  const single = lines.length === 1;
  return {
    value: value.slice(0, from) + joined + value.slice(to),
    start: single ? Math.max(from, start + firstDelta) : from,
    end: single ? Math.max(from, end + firstDelta) : from + joined.length,
  };
}

/** Markdown → plain one-liner, for previews (cards) where rendering it would be too heavy. */
export function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+(\[[ xX]\]\s+)?/gm, "")
    .replace(/(\*\*|__|~~|[*_`])/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
