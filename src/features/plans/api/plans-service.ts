import { apiClient } from "@/lib/api/client";
import type { PaginatedResult } from "@/types/common";
import type {
  Coupon,
  CouponPreview,
  CouponRedemption,
  CreateCouponRequest,
  ListCouponsParams,
  MyPlan,
  Plan,
  UpdateCouponRequest,
} from "@/types/plan";

export const plansService = {
  // Self-service, no pagination — API.md § 23 (`GET /plans` returns `Plan[]` directly).
  async list() {
    const { data } = await apiClient.get<Plan[]>("/plans");
    return data;
  },

  async getMine() {
    const { data } = await apiClient.get<MyPlan>("/plans/me");
    return data;
  },

  // With a coupon, redeeming it and switching plan are atomic: a refused
  // coupon leaves the plan as it was. Without one, moving to ANOTHER plan
  // cancels the current discount.
  async setMine(planId: string, couponCode?: string) {
    const { data } = await apiClient.patch<MyPlan>("/plans/me", {
      planId,
      couponCode: couponCode || undefined,
    });
    return data;
  },

  // Validates without redeeming (nothing reserved). Own rate limit: 20/min.
  async previewCoupon(planId: string, code: string) {
    const { data } = await apiClient.post<CouponPreview>("/plans/coupons/preview", {
      planId,
      code,
    });
    return data;
  },

  async adminList() {
    const { data } = await apiClient.get<Plan[]>("/admin/plans");
    return data;
  },

  async adminCreate(input: { name: string; monthlyTokenBudget: number; monthlyPriceCents?: number }) {
    const { data } = await apiClient.post<Plan>("/admin/plans", input);
    return data;
  },

  // `name` is not editable after creation — it is the stable key referenced
  // by integrations/seed data (API.md § 23). A new price never touches
  // discounts already redeemed (they keep their snapshot).
  async adminUpdate(
    planId: string,
    input: { monthlyTokenBudget?: number; monthlyPriceCents?: number }
  ) {
    const { data } = await apiClient.patch<Plan>(`/admin/plans/${planId}`, input);
    return data;
  },

  async assignToUser(userId: string, planId: string) {
    await apiClient.patch(`/admin/users/${userId}/plan`, { planId });
  },

  // Coupons (SUPER_ADMIN).
  async listCoupons(params: ListCouponsParams) {
    const { data } = await apiClient.get<PaginatedResult<Coupon>>("/admin/coupons", { params });
    return data;
  },

  async createCoupon(input: CreateCouponRequest) {
    const { data } = await apiClient.post<Coupon>("/admin/coupons", input);
    return data;
  },

  async updateCoupon(couponId: string, input: UpdateCouponRequest) {
    const { data } = await apiClient.patch<Coupon>(`/admin/coupons/${couponId}`, input);
    return data;
  },

  // Only a never-redeemed coupon; one with redemptions is deactivated instead.
  async deleteCoupon(couponId: string) {
    await apiClient.delete(`/admin/coupons/${couponId}`);
  },

  async listCouponRedemptions(couponId: string, params: { page?: number; limit?: number }) {
    const { data } = await apiClient.get<PaginatedResult<CouponRedemption>>(
      `/admin/coupons/${couponId}/redemptions`,
      { params }
    );
    return data;
  },
};
