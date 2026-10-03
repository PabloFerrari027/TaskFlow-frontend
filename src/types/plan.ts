// Mirrors API.md § 23. `monthlyTokenBudget` is the only cap stored — the
// daily/weekly caps enforced by TOKEN_QUOTA_GUARD are derived at runtime
// (monthlyTokenBudget / 30 and / 4) and never appear on this DTO.
export interface Plan {
  id: string;
  name: string;
  monthlyTokenBudget: number;
  /** BRL cents, `0` = free. Informative only: there is no checkout yet. */
  monthlyPriceCents: number;
  createdAt: string;
  updatedAt: string;
}

export type CouponDiscountType = "PERCENT" | "FIXED_AMOUNT";
export type CouponDuration = "ONCE" | "REPEATING" | "FOREVER";

export interface DiscountTerms {
  discountType: CouponDiscountType;
  percentOff: number | null;
  amountOffCents: number | null;
  duration: CouponDuration;
  durationInMonths: number | null;
}

/** The discount in force — a snapshot of the price when it was redeemed. */
export interface ActiveDiscount extends DiscountTerms {
  couponCode: string;
  originalPriceCents: number;
  discountedPriceCents: number;
  redeemedAt: string;
  /** `null` = FOREVER (while on this plan). */
  endsAt: string | null;
}

export interface MyPlan {
  /** `null` = no plan assigned: the FREE quota, price 0. */
  plan: Plan | null;
  discount: ActiveDiscount | null;
  effectiveMonthlyPriceCents: number;
}

export interface CouponPreview extends DiscountTerms {
  code: string;
  description: string | null;
  planId: string;
  planName: string;
  originalPriceCents: number;
  discountedPriceCents: number;
  discountCents: number;
  /** Until when it would last if redeemed now (`null` = FOREVER). */
  endsAt: string | null;
}

export interface Coupon extends DiscountTerms {
  id: string;
  /** Stored uppercase; redeeming is case-insensitive. */
  code: string;
  description: string | null;
  /** `null` = unlimited (across every user). */
  maxRedemptions: number | null;
  redemptionCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  /** Empty = any paid plan. */
  planIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponRequest {
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  percentOff?: number;
  amountOffCents?: number;
  duration: CouponDuration;
  durationInMonths?: number;
  maxRedemptions?: number;
  startsAt?: string;
  expiresAt?: string;
  planIds?: string[];
}

// Code and discount terms are immutable — only these change (`null` clears).
export interface UpdateCouponRequest {
  description?: string | null;
  maxRedemptions?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  planIds?: string[];
}

export type CouponStatusFilter = "ACTIVE" | "INACTIVE";

export interface ListCouponsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CouponStatusFilter;
}

export interface CouponRedemption {
  id: string;
  userId: string;
  userEmail: string;
  /** `null` if the plan was deleted afterwards. */
  planId: string | null;
  planName: string;
  originalPriceCents: number;
  discountedPriceCents: number;
  redeemedAt: string;
  endsAt: string | null;
  /** Set when the user changed plan or applied another coupon. */
  canceledAt: string | null;
}
