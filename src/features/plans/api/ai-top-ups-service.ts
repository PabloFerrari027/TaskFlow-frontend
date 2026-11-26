import { apiClient } from "@/lib/api/client";
import type {
  AiTopUpPack,
  AiTopUpPackAdmin,
  CreateAiTopUpPackRequest,
  MyAiTopUps,
  StartAiTopUpCheckoutResponse,
  UpdateAiTopUpPackRequest,
} from "@/types/ai-top-up";

// Mirrors contratos-recarga.md § 5 ("Recarga de IA", /billing/ai-top-ups and
// /admin/ai-top-up-packs). The balance only changes when Stripe confirms the
// payment (webhook), never on the redirect back.
export const aiTopUpsService = {
  // Active packs only, already sorted by the server.
  async listPacks() {
    const { data } = await apiClient.get<{ data: AiTopUpPack[] }>("/billing/ai-top-ups/packs");
    return data.data;
  },

  // Opens a Stripe-hosted payment page; redirect the user to `url`.
  async startCheckout(packId: string) {
    const { data } = await apiClient.post<StartAiTopUpCheckoutResponse>(
      "/billing/ai-top-ups/checkout",
      { packId }
    );
    return data;
  },

  // Balance in whole credits + the purchase history (paginated).
  async getMine(params: { page?: number; limit?: number } = {}) {
    const { data } = await apiClient.get<MyAiTopUps>("/billing/ai-top-ups/me", { params });
    return data;
  },

  // ---- SUPER_ADMIN. Same `{ data }` envelope as the user's list (API.md § 46),
  // but including inactive packs.
  async listAdminPacks() {
    const { data } = await apiClient.get<{ data: AiTopUpPackAdmin[] }>("/admin/ai-top-up-packs");
    return data.data;
  },

  async createAdminPack(input: CreateAiTopUpPackRequest) {
    const { data } = await apiClient.post<AiTopUpPackAdmin>("/admin/ai-top-up-packs", input);
    return data;
  },

  async updateAdminPack(packId: string, input: UpdateAiTopUpPackRequest) {
    const { data } = await apiClient.patch<AiTopUpPackAdmin>(`/admin/ai-top-up-packs/${packId}`, input);
    return data;
  },
};
