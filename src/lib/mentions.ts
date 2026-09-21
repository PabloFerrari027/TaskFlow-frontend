import { shortenId } from "@/lib/format";

/**
 * The API keeps mentions as a separate `mentionedUserIds` list, but member
 * endpoints never expose names — so the `@` token written in the text is the
 * user's shortened id. The text is the source of truth: a mention exists only
 * while its token is still in the text.
 */
export function mentionToken(userId: string) {
  return `@${shortenId(userId)}`;
}

function tokenRegex(userId: string) {
  return new RegExp(`(^|\\s)${mentionToken(userId)}(?![\\w-])`);
}

/** Which of the candidate users are actually mentioned in `content`. */
export function extractMentionedUserIds(content: string, candidateUserIds: string[]) {
  return candidateUserIds.filter((userId) => tokenRegex(userId).test(content));
}

/** Splits `content` into plain-text and mention parts, for highlighting. */
export function splitMentions(content: string, mentionedUserIds: string[]) {
  const tokens = mentionedUserIds.map((id) => mentionToken(id));
  if (tokens.length === 0) return [{ text: content, mention: false }];

  const pattern = new RegExp(`(^|\\s)(${tokens.join("|")})(?![\\w-])`, "g");
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
