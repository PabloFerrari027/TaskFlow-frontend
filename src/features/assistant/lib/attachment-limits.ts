// Mirrors the server's own defaults (API.md § 16, `.env.example`) so the
// composer can reject an over-limit selection immediately instead of round
// tripping to the server — the server re-validates regardless (these are
// env-configurable there and can drift from these numbers).
export const ASSISTANT_ATTACHMENT_MAX_FILE_BYTES = 20 * 1024 * 1024;
export const ASSISTANT_ATTACHMENT_MAX_TOTAL_BYTES = 14 * 1024 * 1024;
export const ASSISTANT_ATTACHMENT_MAX_COUNT = 6;
export const ASSISTANT_ATTACHMENT_MAX_AUDIO_SECONDS = 600;

// The formats the server transcribes (API.md § 16, "Anexos de áudio"). The
// extension is a fallback for when the OS reports no/odd MIME type (`.opus`
// and `.m4a` often come through as "" or "video/mp4" on Windows) — the server
// decides by the file's bytes anyway.
const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|ogg|oga|opus|webm|flac|aac)$/i;

export function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  return (file.type === "" || file.type === "video/mp4") && AUDIO_EXTENSIONS.test(file.name);
}

export function validateNewFiles(
  existing: File[],
  incoming: File[]
): { accepted: File[]; error: string | null } {
  const oversized = incoming.find((file) => file.size > ASSISTANT_ATTACHMENT_MAX_FILE_BYTES);
  if (oversized) {
    return { accepted: [], error: `"${oversized.name}" excede o limite de 20MB por arquivo.` };
  }

  const combined = [...existing, ...incoming];
  if (combined.length > ASSISTANT_ATTACHMENT_MAX_COUNT) {
    return {
      accepted: [],
      error: `Você pode anexar no máximo ${ASSISTANT_ATTACHMENT_MAX_COUNT} arquivos por mensagem.`,
    };
  }

  const totalBytes = combined.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > ASSISTANT_ATTACHMENT_MAX_TOTAL_BYTES) {
    return {
      accepted: [],
      error: "A soma dos anexos excede o limite de 14MB por mensagem.",
    };
  }

  return { accepted: incoming, error: null };
}
