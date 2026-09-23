// Mirrors API.md § 23. `monthlyTokenBudget` is the only number stored — the
// daily/weekly caps enforced by TOKEN_QUOTA_GUARD are derived at runtime
// (monthlyTokenBudget / 30 and / 4) and never appear on this DTO.
export interface Plan {
  id: string;
  name: string;
  monthlyTokenBudget: number;
  createdAt: string;
  updatedAt: string;
}
