import { apiClient } from "@/lib/api/client";
import type { Plan } from "@/types/plan";

export const plansService = {
  // Self-service, no pagination — API.md § 23 (`GET /plans` returns `Plan[]` directly).
  async list() {
    const { data } = await apiClient.get<Plan[]>("/plans");
    return data;
  },

  async setMine(planId: string) {
    await apiClient.patch("/plans/me", { planId });
  },

  async adminList() {
    const { data } = await apiClient.get<Plan[]>("/admin/plans");
    return data;
  },

  async adminCreate(input: { name: string; monthlyTokenBudget: number }) {
    const { data } = await apiClient.post<Plan>("/admin/plans", input);
    return data;
  },

  // `name` isn't editable after creation — it's the stable key referenced by
  // integrations/seed data (API.md § 23).
  async adminUpdate(planId: string, input: { monthlyTokenBudget: number }) {
    const { data } = await apiClient.patch<Plan>(`/admin/plans/${planId}`, input);
    return data;
  },

  async assignToUser(userId: string, planId: string) {
    await apiClient.patch(`/admin/users/${userId}/plan`, { planId });
  },
};
