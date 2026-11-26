import type { PaginatedResult } from "@/types/common";

// Mirrors the frozen contract (contratos-recarga.md § 5). Internally the API
// works in µUSD, but the user only ever sees whole credits and BRL cents:
// never µUSD, never tokens. The admin routes of this module use the same
// credit unit.

export interface AiTopUpPack {
  id: string;
  name: string;
  /** Whole credits (1 credit = 1,000 µUSD on the server; the front never shows µUSD). */
  credits: number;
  priceCents: number;
  currency: string;
}

export interface StartAiTopUpCheckoutResponse {
  purchaseId: string;
  /** Stripe-hosted payment page: redirect the user there. */
  url: string;
  expiresAt: string;
  packId: string;
  packName: string;
  credits: number;
  priceCents: number;
  currency: string;
}

export type AiTopUpPurchaseStatus =
  | "PENDING"
  | "COMPLETED"
  | "EXPIRED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "DISPUTED";

export interface AiTopUpPurchase {
  id: string;
  packName: string;
  credits: number;
  priceCents: number;
  currency: string;
  status: AiTopUpPurchaseStatus;
  refundedCents: number;
  createdAt: string;
  completedAt: string | null;
}

export interface MyAiTopUps {
  balance: {
    credits: number;
    /** `null` = nothing to expire (no balance). */
    nextExpiresAt: string | null;
    nextExpiringCredits: number;
  };
  purchases: PaginatedResult<AiTopUpPurchase>;
}

export interface AiTopUpPackAdmin {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAiTopUpPackRequest {
  name: string;
  credits: number;
  priceCents: number;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateAiTopUpPackRequest = Partial<CreateAiTopUpPackRequest>;
