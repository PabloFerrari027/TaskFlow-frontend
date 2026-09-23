import { shortenId } from "@/lib/format";

/** userId → display name, for the members whose name is known. */
export type MentionNames = ReadonlyMap<string, string>;

/**
 * The API keeps mentions as a separate `mentionedUserIds` list; the `@` token
 * written in the text is the member's name (or their shortened id while the
 * backend hasn't given us one). The text is the source of truth: a mention
 * exists only while its token is still in the text.
 */
export function mentionToken(userId: string, names?: MentionNames) {
  const name = names?.get(userId)?.trim();
  return `@${name || shortenId(userId)}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Longest token first, so "@Ana Maria" isn't swallowed by "@Ana". A token ends
// where the next character would continue the word, names included.
function tokenPattern(tokens: string[]) {
  const sorted = Array.from(new Set(tokens)).sort((a, b) => b.length - a.length);
  return new RegExp(`(^|\\s)(${sorted.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}_-])`, "giu");
}

/** Which of the candidate users are actually mentioned in `content`. */
export function extractMentionedUserIds(
  content: string,
  candidateUserIds: string[],
  names?: MentionNames,
) {
  if (candidateUserIds.length === 0) return [];

  const idsByToken = new Map<string, string[]>();
  for (const userId of candidateUserIds) {
    const key = mentionToken(userId, names).toLowerCase();
    idsByToken.set(key, [...(idsByToken.get(key) ?? []), userId]);
  }

  const found = new Set<string>();
  const pattern = tokenPattern(candidateUserIds.map((id) => mentionToken(id, names)));
  for (const match of content.matchAll(pattern)) {
    idsByToken.get(match[2].toLowerCase())?.forEach((id) => found.add(id));
  }

  return candidateUserIds.filter((id) => found.has(id));
}

/** Splits `content` into plain-text and mention parts, for highlighting. */
export function splitMentions(content: string, mentionedUserIds: string[], names?: MentionNames) {
  if (mentionedUserIds.length === 0) return [{ text: content, mention: false }];

  const pattern = tokenPattern(mentionedUserIds.map((id) => mentionToken(id, names)));
  const parts: { text: string; mention: boolean }[] = [];
  let last = 0;

  for (const match of content.matchAll(pattern)) {
    const start = match.index + match[1].length;
    if (start > last) parts.push({ text: content.slice(last, start), mention: false });
    parts.push({ text: match[2], mention: true });
    last = start + match[2].length;
  }
  if (last < content.length) parts.push({ text: content.slice(last), mention: false });

  return parts;
}
