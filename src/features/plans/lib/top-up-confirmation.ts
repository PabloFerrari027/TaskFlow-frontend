import type { MyAiTopUps } from "@/types/ai-top-up";

/**
 * The webhook moved the balance, or settled the newest purchase (list order:
 * newest first). `first` is the first picture seen after the return.
 */
export function isTopUpConfirmed(data: MyAiTopUps | undefined, first: MyAiTopUps | undefined) {
  if (!data) return false;
  if (first && data.balance.credits !== first.balance.credits) return true;
  const newest = data.purchases.data[0];
  return newest !== undefined && newest.status !== "PENDING";
}
