export { cn } from "cn"

// Deterministic JSON serialization — object keys are sorted recursively so
// two logically-equal objects always produce the same string, regardless of
// the order their properties were set in. Used for query keys built from
// request objects (e.g. analytics queries), where insertion order otherwise
// makes React Query treat identical requests as different cache entries.
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortForStableStringify(value));
}

function sortForStableStringify(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForStableStringify);
  }
  if (value !== null && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((sorted, key) => {
        sorted[key] = sortForStableStringify((value as Record<string, unknown>)[key]);
        return sorted;
      }, {});
  }
  return value;
}
