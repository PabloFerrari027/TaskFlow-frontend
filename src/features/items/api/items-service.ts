import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  BulkResult,
  BulkUpdateItemEntry,
  ChangeItemStatusRequest,
  CreateItemRequest,
  CreateWorkflowStatusRequest,
  DeletedItem,
  DeleteWorkflowStatusResponse,
  FolderTimeline,
  RestoredItem,
  Item,
  ItemDependencies,
  TrashedItem,
  UpdateItemRequest,
  UpdateWorkflowStatusRequest,
  WorkflowStatus,
} from "@/types/item";

// Server cap per bulk call (`MAX_BULK_ITEMS_BATCH_SIZE`); a bigger batch is
// rejected outright with `BULK_BATCH_TOO_LARGE` without processing any item.
const MAX_BULK_BATCH_SIZE = 100;

// Splits `items` into calls of at most `MAX_BULK_BATCH_SIZE` and stitches the
// answers back into one result, as if it had been a single call: `index` is
// rewritten to be relative to the whole array. Calls run one after the other so
// the items keep being applied in the order given (positions depend on it).
async function runInBatches<TItem, TData>(
  items: TItem[],
  send: (batch: TItem[]) => Promise<BulkResult<TData>>
): Promise<BulkResult<TData>> {
  const merged: BulkResult<TData> = { total: 0, succeeded: 0, failed: 0, results: [] };

  for (let start = 0; start < items.length; start += MAX_BULK_BATCH_SIZE) {
    const batch = await send(items.slice(start, start + MAX_BULK_BATCH_SIZE));
    merged.total += batch.total;
    merged.succeeded += batch.succeeded;
    merged.failed += batch.failed;
    for (const result of batch.results) {
      merged.results.push({ ...result, index: result.index + start });
    }
  }

  return merged;
}

export const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_COVER_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const itemsService = {
  async listByFolder(folderId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<Item>>(
      `/folders/${folderId}/items`,
      { params }
    );
    return data;
  },

  async get(itemId: string) {
    const { data } = await apiClient.get<Item>(`/items/${itemId}`);
    return data;
  },

  async listSubitems(itemId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<Item>>(
      `/items/${itemId}/subitems`,
      { params }
    );
    return data;
  },

  async listBySection(sectionId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<Item>>(
      `/sections/${sectionId}/items`,
      { params }
    );
    return data;
  },

  async create(folderId: string, payload: CreateItemRequest) {
    const { data } = await apiClient.post<Item>(
      `/folders/${folderId}/items`,
      payload
    );
    return data;
  },

  async update(itemId: string, payload: UpdateItemRequest) {
    const { data } = await apiClient.patch<Item>(`/items/${itemId}`, payload);
    return data;
  },

  // The three bulk calls answer 200 even when every item fails: the outcome is
  // per item (`results`), with no rollback of the ones that went through.
  bulkCreate(folderId: string, items: CreateItemRequest[]) {
    return runInBatches(items, async (batch) => {
      const { data } = await apiClient.post<BulkResult<Item>>(
        `/folders/${folderId}/items/bulk`,
        { items: batch }
      );
      return data;
    });
  },

  bulkUpdate(items: BulkUpdateItemEntry[]) {
    return runInBatches(items, async (batch) => {
      const { data } = await apiClient.patch<BulkResult<Item>>("/items/bulk", { items: batch });
      return data;
    });
  },

  bulkDelete(itemIds: string[]) {
    return runInBatches(itemIds, async (batch) => {
      const { data } = await apiClient.post<BulkResult<DeletedItem>>("/items/bulk-delete", {
        itemIds: batch,
      });
      return data;
    });
  },

  async changeStatus(itemId: string, payload: ChangeItemStatusRequest) {
    const { data } = await apiClient.patch<Item>(
      `/items/${itemId}/status`,
      payload
    );
    return data;
  },

  async uploadAttachment(itemId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<Item>(
      `/items/${itemId}/attachments`,
      formData
    );
    return data;
  },

  async downloadAttachment(itemId: string, attachmentId: string) {
    const response = await apiClient.get(
      `/items/${itemId}/attachments/${attachmentId}/download`,
      { responseType: "blob" }
    );
    return response.data as Blob;
  },

  async removeAttachment(itemId: string, attachmentId: string) {
    const { data } = await apiClient.delete<Item>(
      `/items/${itemId}/attachments/${attachmentId}`
    );
    return data;
  },

  async setCover(itemId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.put<Item>(`/items/${itemId}/cover`, formData);
    return data;
  },

  async getCover(itemId: string) {
    const response = await apiClient.get(`/items/${itemId}/cover`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },

  // Idempotent on the server: an item without a cover comes back unchanged.
  async removeCover(itemId: string) {
    const { data } = await apiClient.delete<Item>(`/items/${itemId}/cover`);
    return data;
  },

  // --- Custom statuses (etapas). Every write answers with the whole list.
  async listStatuses(folderId: string) {
    const { data } = await apiClient.get<WorkflowStatus[]>(`/folders/${folderId}/statuses`);
    return data;
  },

  async createStatus(folderId: string, payload: CreateWorkflowStatusRequest) {
    const { data } = await apiClient.post<WorkflowStatus[]>(
      `/folders/${folderId}/statuses`,
      payload
    );
    return data;
  },

  async updateStatus(statusId: string, payload: UpdateWorkflowStatusRequest) {
    const { data } = await apiClient.patch<WorkflowStatus[]>(`/statuses/${statusId}`, payload);
    return data;
  },

  // Items in the deleted status move to `replacementStatusId` (same category) —
  // required when any item uses it.
  async deleteStatus(statusId: string, replacementStatusId?: string) {
    const { data } = await apiClient.delete<DeleteWorkflowStatusResponse>(
      `/statuses/${statusId}`,
      { params: { replacementStatusId } }
    );
    return data;
  },

  // --- Trash
  async listTrash(folderId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<TrashedItem>>(
      `/folders/${folderId}/trash`,
      { params }
    );
    return data;
  },

  async restore(itemId: string) {
    const { data } = await apiClient.post<RestoredItem>(`/items/${itemId}/restore`);
    return data;
  },

  // --- Dependencies and timeline
  async listDependencies(itemId: string) {
    const { data } = await apiClient.get<ItemDependencies>(`/items/${itemId}/dependencies`);
    return data;
  },

  async addDependency(itemId: string, blockerItemId: string) {
    const { data } = await apiClient.post<ItemDependencies>(`/items/${itemId}/dependencies`, {
      blockerItemId,
    });
    return data;
  },

  async removeDependency(itemId: string, blockerItemId: string) {
    const { data } = await apiClient.delete<ItemDependencies>(
      `/items/${itemId}/dependencies/${blockerItemId}`
    );
    return data;
  },

  async timeline(folderId: string, params?: { from?: string; to?: string }) {
    const { data } = await apiClient.get<FolderTimeline>(`/folders/${folderId}/timeline`, {
      params,
    });
    return data;
  },

  async addParticipant(itemId: string, userId: string) {
    const { data } = await apiClient.post<Item>(`/items/${itemId}/participants`, {
      userId,
    });
    return data;
  },

  async removeParticipant(itemId: string, userId: string) {
    const { data } = await apiClient.delete<Item>(
      `/items/${itemId}/participants/${userId}`
    );
    return data;
  },
};
