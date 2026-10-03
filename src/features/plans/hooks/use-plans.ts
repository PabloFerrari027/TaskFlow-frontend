"use client";

import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { plansService } from "@/features/plans/api/plans-service";
import { assistantService } from "@/features/assistant/api/assistant-service";
import { quotaWindowStarts } from "@/features/plans/lib/plan-caps";
import { queryKeys } from "@/lib/query-keys";
import { getErrorCode, getErrorMessage } from "@/lib/errors";
import type {
  CreateCouponRequest,
  ListCouponsParams,
  UpdateCouponRequest,
} from "@/types/plan";

export function usePlansQuery() {
  return useQuery({
    queryKey: queryKeys.plans.all(),
    queryFn: () => plansService.list(),
  });
}

/** The current plan, its discount and the price after it (API.md § 23). */
export function useMyPlanQuery() {
  return useQuery({
    queryKey: queryKeys.plans.mine(),
    queryFn: () => plansService.getMine(),
  });
}

// Errors are shown inline by the coupon field.
export function usePreviewCouponMutation() {
  return useMutation({
    mutationFn: ({ planId, code }: { planId: string; code: string }) =>
      plansService.previewCoupon(planId, code),
  });
}

export const QUOTA_WINDOWS = ["day", "week", "month"] as const;
export type QuotaWindow = (typeof QUOTA_WINDOWS)[number];

// `/ai-usage/me` is throttled to 30 req/60s and each call aggregates the whole
// range (API.md § 1.4), so these three stay cached for a while and only
// refresh on demand — not on focus, not on every mount.
const WINDOW_USAGE_STALE_TIME = 5 * 60 * 1000;

// Tokens spent since the start of a quota window, read from
// `summary.totalTokens` with the smallest page of `items`. Deliberately not
// compared to a cap: the user's current plan can't be read (API.md § 23).
function quotaWindowUsageOptions(window: QuotaWindow, now: Date) {
  const from = quotaWindowStarts(now)[window].toISOString();
  return {
    queryKey: queryKeys.aiUsage.window(window, from),
    queryFn: async () => {
      const { summary } = await assistantService.getMyAiUsage({ from, page: 1, limit: 1 });
      return summary.totalTokens;
    },
    staleTime: WINDOW_USAGE_STALE_TIME,
    refetchOnWindowFocus: false,
  };
}

export function useQuotaWindowUsageQuery(window: QuotaWindow, options?: { enabled?: boolean }) {
  return useQuery({ ...quotaWindowUsageOptions(window, new Date()), enabled: options?.enabled });
}

export function useQuotaWindowsUsageQueries() {
  const now = new Date();
  return useQueries({
    queries: QUOTA_WINDOWS.map((window) => quotaWindowUsageOptions(window, now)),
  });
}

// Answers with the same shape as `GET /plans/me`, already reflecting the
// change. A coupon is redeemed atomically with it; coupon errors are shown
// inline by the dialog, so they are not toasted here.
export function useSetMyPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ plan, couponCode }: { plan: { id: string; name: string }; couponCode?: string }) =>
      plansService.setMine(plan.id, couponCode),
    onSuccess: (myPlan, { plan, couponCode }) => {
      queryClient.setQueryData(queryKeys.plans.mine(), myPlan);
      toast.success(
        couponCode && myPlan.discount
          ? `Plano ${plan.name} com o cupom ${myPlan.discount.couponCode}.`
          : `Plano ${plan.name} escolhido.`
      );
    },
    onError: (error) => {
      if (getErrorCode(error)?.startsWith("COUPON_")) return;
      // A SUPER_ADMIN may have removed or changed the plan since the list
      // loaded — refresh it so the user picks from what exists now.
      if (getErrorCode(error) === "PLAN_NOT_FOUND") {
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.all() });
        toast.error("Esse plano não está mais disponível. A lista foi atualizada.");
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });
}

export function useAdminPlansQuery() {
  return useQuery({
    queryKey: queryKeys.plans.admin.all(),
    queryFn: () => plansService.adminList(),
  });
}

export function useCreatePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; monthlyTokenBudget: number; monthlyPriceCents?: number }) =>
      plansService.adminCreate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.admin.all() });
      toast.success("Plano criado.");
    },
    onError: (error) => {
      // A duplicate name is a field error, shown inline by the form — not a
      // generic toast.
      if (getErrorCode(error) === "PLAN_NAME_ALREADY_EXISTS") return;
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdatePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      monthlyTokenBudget,
      monthlyPriceCents,
    }: {
      planId: string;
      monthlyTokenBudget: number;
      monthlyPriceCents: number;
    }) => plansService.adminUpdate(planId, { monthlyTokenBudget, monthlyPriceCents }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.admin.all() });
      toast.success("Plano atualizado.");
    },
    onError: (error) => {
      if (getErrorCode(error) === "PLAN_NOT_FOUND") {
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.admin.all() });
        toast.error("Esse plano não existe mais. A lista foi atualizada.");
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });
}

// CLIENT_NOT_FOUND falls through to its generic message; PLAN_NOT_FOUND also
// refreshes the options so the admin picks from what exists now.
export function useAssignUserPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, planId }: { userId: string; planId: string }) =>
      plansService.assignToUser(userId, planId),
    onSuccess: () => toast.success("Plano do cliente atualizado."),
    onError: (error) => {
      if (getErrorCode(error) === "PLAN_NOT_FOUND") {
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.admin.all() });
        toast.error("Esse plano não existe mais. A lista foi atualizada.");
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });
}

// ---------------------------------------------------------------- coupons (SUPER_ADMIN)

export function useCouponsQuery(params: ListCouponsParams) {
  return useQuery({
    queryKey: queryKeys.coupons.list(params),
    queryFn: () => plansService.listCoupons(params),
    placeholderData: keepPreviousData,
    // A 403 means "not a super admin" — the page redirects, no retry.
    retry: false,
  });
}

export function useCouponRedemptionsQuery(couponId: string | null, page: number) {
  return useQuery({
    queryKey: queryKeys.coupons.redemptions(couponId ?? "", page),
    queryFn: () => plansService.listCouponRedemptions(couponId!, { page, limit: 20 }),
    enabled: Boolean(couponId),
    placeholderData: keepPreviousData,
  });
}

// Field errors (code taken, inconsistent terms) are shown by the form.
const FORM_COUPON_ERRORS = new Set(["COUPON_CODE_ALREADY_EXISTS", "INVALID_COUPON"]);

export function useCreateCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCouponRequest) => plansService.createCoupon(input),
    onSuccess: (coupon) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.root() });
      toast.success(`Cupom ${coupon.code} criado.`);
    },
    onError: (error) => {
      if (FORM_COUPON_ERRORS.has(getErrorCode(error) ?? "")) return;
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ couponId, input }: { couponId: string; input: UpdateCouponRequest }) =>
      plansService.updateCoupon(couponId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.root() });
      toast.success("Cupom atualizado.");
    },
    onError: (error) => {
      if (getErrorCode(error) === "INVALID_COUPON") return;
      if (getErrorCode(error) === "COUPON_NOT_FOUND") {
        queryClient.invalidateQueries({ queryKey: queryKeys.coupons.root() });
      }
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (couponId: string) => plansService.deleteCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.root() });
      toast.success("Cupom apagado.");
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.root() });
      toast.error(getErrorMessage(error));
    },
  });
}
