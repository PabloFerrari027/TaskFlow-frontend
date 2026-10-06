"use client";

import * as React from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { itemsService } from "@/features/items/api/items-service";
import {
  scheduleItemListsRefresh,
  shouldRestoreSnapshot,
  ITEM_MUTATION_KEY,
} from "@/features/items/lib/item-list-refresh";
import { queryKeys } from "@/lib/query-keys";
import { celebrate } from "@/lib/celebrate";
import { getBulkItemErrorMessage, getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE, type PaginatedResult } from "@/types/common";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import {
  isOffline,
  pushImmediate,
  queueEntityDelete,
  queueEntityUpdate,
} from "@/features/sync/lib/sync-engine";
import type {
  Attachment,
  BulkResult,
  ChangeItemStatusRequest,
  CreateItemRequest,
  Item,
  ItemStatus,
  UpdateItemRequest,
} from "@/types/item";

function withCountAdjusted(result: PaginatedResult<Item>, delta: number): PaginatedResult<Item> {
  const total = Math.max(0, result.meta.total + delta);
  return {
    ...result,
    meta: {
      ...result.meta,
      total,
      totalPages: Math.max(1, Math.ceil(total / result.meta.limit)),
    },
  };
}

type PreviousSectionEntries = Array<{ queryKey: QueryKey; data: PaginatedResult<Item> }>;

function restoreSectionEntries(queryClient: QueryClient, entries?: PreviousSectionEntries) {
  if (!shouldRestoreSnapshot(queryClient)) return;
  entries?.forEach(({ queryKey, data }) => queryClient.setQueryData(queryKey, data));
}

// Each board column is its own paginated cache (items.bySection), so a
// cross-column move has to touch the source and the destination directly.
// Returns the entries it overwrote so the caller can roll back.
function moveItemBetweenSectionCaches(
  queryClient: QueryClient,
  itemId: string,
  toSectionId: string
): PreviousSectionEntries {
  const previousEntries: PreviousSectionEntries = [];
  let movedItem: Item | undefined;

  for (const [key, data] of queryClient.getQueriesData<PaginatedResult<Item>>({
    queryKey: queryKeys.items.bySectionAll(),
  })) {
    if (!data) continue;
    const found = data.data.find((t) => t.id === itemId);
    if (!found) continue;
    movedItem = found;
    previousEntries.push({ queryKey: key, data });
    queryClient.setQueryData<PaginatedResult<Item>>(
      key,
      withCountAdjusted({ ...data, data: data.data.filter((t) => t.id !== itemId) }, -1)
    );
  }

  if (movedItem) {
    for (const [key, data] of queryClient.getQueriesData<PaginatedResult<Item>>({
      queryKey: queryKeys.items.bySection(toSectionId),
    })) {
      if (!data) continue;
      previousEntries.push({ queryKey: key, data });
      queryClient.setQueryData<PaginatedResult<Item>>(
        key,
        withCountAdjusted(
          { ...data, data: [...data.data, { ...movedItem, sectionId: toSectionId }] },
          1
        )
      );
    }
  }

  return previousEntries;
}

function removeItemsFromSectionCaches(
  queryClient: QueryClient,
  itemIds: Set<string>
): PreviousSectionEntries {
  const previousEntries: PreviousSectionEntries = [];

  for (const [key, data] of queryClient.getQueriesData<PaginatedResult<Item>>({
    queryKey: queryKeys.items.bySectionAll(),
  })) {
    if (!data) continue;
    const remaining = data.data.filter((t) => !itemIds.has(t.id));
    if (remaining.length === data.data.length) continue;
    previousEntries.push({ queryKey: key, data });
    queryClient.setQueryData<PaginatedResult<Item>>(
      key,
      withCountAdjusted({ ...data, data: remaining }, remaining.length - data.data.length)
    );
  }

  return previousEntries;
}

/** Options shared by the mutations that the spreadsheet-style table drives. */
interface ItemMutationOptions {
  /**
   * Inline edits in the table save cell by cell, so a success toast and a full
   * refetch per cell would be noise: `silent` skips the toast and patches the
   * item in place in every cached list instead. Errors still toast.
   */
  silent?: boolean;
}

const LIST_CACHE_PREFIXES = [queryKeys.items.bySectionAll(), queryKeys.items.byFolderAll()];

function patchItemInLists(queryClient: QueryClient, item: Item) {
  for (const queryKey of LIST_CACHE_PREFIXES) {
    queryClient.setQueriesData<PaginatedResult<Item>>({ queryKey }, (data) =>
      data && Array.isArray(data.data)
        ? { ...data, data: data.data.map((t) => (t.id === item.id ? item : t)) }
        : data
    );
  }
  // The lists above are already correct; this only makes caches nobody is
  // looking at right now refetch the next time they're mounted.
  queryClient.invalidateQueries({ queryKey: queryKeys.items.all(item.folderId), refetchType: "none" });
  queryClient.invalidateQueries({ queryKey: queryKeys.items.bySectionAll(), refetchType: "none" });
  queryClient.invalidateQueries({ queryKey: queryKeys.folderStats.root(), refetchType: "none" });
  queryClient.invalidateQueries({ queryKey: queryKeys.home.root(), refetchType: "none" });
}

// The detail cache is only filled once an item is opened, but the mutations need
// the current copy (version, assignee) for offline queueing and to clear an
// assignee — so fall back to the copy sitting in a cached list.
function findCachedItem(queryClient: QueryClient, itemId: string): Item | undefined {
  const detail = queryClient.getQueryData<Item>(queryKeys.items.detail(itemId));
  if (detail) return detail;
  for (const queryKey of LIST_CACHE_PREFIXES) {
    for (const [, data] of queryClient.getQueriesData<PaginatedResult<Item>>({ queryKey })) {
      const found = Array.isArray(data?.data) ? data.data.find((t) => t.id === itemId) : undefined;
      if (found) return found;
    }
  }
  return undefined;
}

// What `/sync/push` applies to an ITEM (`item-sync.handler.ts` on the backend);
// `position` rides along with `sectionId` for the optimistic copy. Anything
// else — dates, priority, estimates, several assignees, mentions — only exists
// on REST, so it can't be queued: it is dropped and the person is told.
const SYNCABLE_ITEM_FIELDS = new Set([
  "title",
  "description",
  "assigneeId",
  "parentItemId",
  "sectionId",
  "position",
  "status",
]);

function splitSyncablePayload(payload: Record<string, unknown>) {
  const syncable: Record<string, unknown> = {};
  const dropped: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    if (SYNCABLE_ITEM_FIELDS.has(key)) syncable[key] = value;
    else dropped.push(key);
  }
  return { syncable, dropped };
}

/** Toasts the backend's notices about a status change (e.g. finished with open blockers). */
export function toastItemWarnings(item: Item) {
  for (const warning of item.warnings ?? []) toast.warning(translateItemWarning(warning));
}

// The server writes these in English; the one it sends today is about blockers.
function translateItemWarning(warning: string) {
  if (/block/i.test(warning)) {
    return "Item concluído, mas ele ainda depende de itens que não terminaram.";
  }
  return warning;
}

// Item lists can realistically grow large, so this is genuinely paged.
export function useItemsQuery(folderId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.items.all(folderId, page),
    queryFn: () => itemsService.listByFolder(folderId, { page }),
    placeholderData: (previous) => previous,
  });
}

export function useItemQuery(itemId: string) {
  return useQuery({
    queryKey: queryKeys.items.detail(itemId),
    queryFn: () => itemsService.get(itemId),
  });
}

// Subitems per item are realistically few — fetch the max page size once.
export function useSubitemsQuery(itemId: string) {
  return useQuery({
    queryKey: queryKeys.items.subitems(itemId),
    queryFn: () => itemsService.listSubitems(itemId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
  });
}

// One column of the item board. Each column pages independently.
export function useItemsBySectionQuery(sectionId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.items.bySection(sectionId, page),
    queryFn: () => itemsService.listBySection(sectionId, { page }),
    placeholderData: (previous) => previous,
  });
}

export function useCreateItemMutation(
  folderId: string,
  { silent = false }: ItemMutationOptions = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ITEM_MUTATION_KEY,
    mutationFn: (payload: CreateItemRequest) => itemsService.create(folderId, payload),
    onSuccess: (item) => {
      scheduleItemListsRefresh(queryClient, { subitemParentIds: [item.parentItemId] });
      if (!silent) toast.success("Item criado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateItemMutation(
  itemId: string,
  { silent = false }: ItemMutationOptions = {}
) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationKey: ITEM_MUTATION_KEY,
    mutationFn: (payload: UpdateItemRequest) => {
      const current = findCachedItem(queryClient, itemId);
      if (isOffline() && workspaceId && current) {
        // Queueing a REST-only field would drop it silently while the
        // optimistic copy showed it as saved, so it's left out and the user is told.
        const { mentionedUserIds, ...rest } = payload;
        const { syncable, dropped } = splitSyncablePayload(rest);
        const currentMentions = current.mentionedUserIds ?? [];
        const mentionsChanged =
          !!mentionedUserIds &&
          (mentionedUserIds.length !== currentMentions.length ||
            mentionedUserIds.some((id) => !currentMentions.includes(id)));
        if (dropped.length > 0 || mentionsChanged) {
          if (Object.keys(syncable).length === 0) {
            throw new Error("Sem conexão: essa alteração só pode ser feita online.");
          }
          toast.warning(
            "Parte da edição só pode ser feita online (como datas, prioridade e menções) — o restante foi salvo."
          );
        }
        return Promise.resolve(
          queueEntityUpdate({
            workspaceId,
            entityType: "ITEM",
            entityId: itemId,
            payload: syncable,
            current,
            meta: { folderId: current.folderId },
          })
        );
      }
      return itemsService.update(itemId, payload);
    },
    onSuccess: (item) => {
      queryClient.setQueryData(queryKeys.items.detail(itemId), item);
      if (silent) {
        patchItemInLists(queryClient, item);
        return;
      }
      // `sectionId` may have changed, moving the item between columns — the
      // refresh covers every column since we don't track the previous one here.
      scheduleItemListsRefresh(queryClient);
      toast.success(
        isOffline()
          ? "Alteração salva offline — será sincronizada quando a conexão voltar."
          : "Item atualizado."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * `PATCH /items/:itemId` can never send `assigneeId: null` — omitting the
 * field just leaves the current assignee untouched, and there is no REST
 * way to clear it (API.md § 9). Clearing an assignee is only possible
 * through `/sync/push`, so this always goes through the sync engine —
 * queued when offline, pushed immediately (still bypassing REST) when
 * online — instead of `itemsService.update`.
 */
export function useUnassignItemMutation(
  itemId: string,
  { silent = false }: ItemMutationOptions = {}
) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationKey: ITEM_MUTATION_KEY,
    mutationFn: async () => {
      const current = findCachedItem(queryClient, itemId);
      if (!workspaceId || !current) {
        throw new Error("Não foi possível remover o responsável: dados do item indisponíveis.");
      }

      if (isOffline()) {
        const item = queueEntityUpdate({
          workspaceId,
          entityType: "ITEM",
          entityId: itemId,
          payload: { assigneeId: null },
          current,
          meta: { folderId: current.folderId },
        });
        queryClient.setQueryData(queryKeys.items.detail(itemId), item);
        return { folderId: item.folderId, queuedOffline: true, applied: true };
      }

      // `pushImmediate` already reconciles the cache (including the fresh
      // `version`) and toasts on REJECTED/CONFLICT — this only decides
      // whether the success toast below should fire.
      const result = await pushImmediate(queryClient, workspaceId, {
        entityType: "ITEM",
        entityId: itemId,
        operationType: "UPDATE",
        payload: { assigneeId: null },
        baseVersion: current.version,
      });
      return {
        folderId: current.folderId,
        queuedOffline: false,
        applied: result?.status === "APPLIED",
      };
    },
    onSuccess: ({ queuedOffline, applied }) => {
      if (!applied) return;
      scheduleItemListsRefresh(queryClient);
      if (silent) return;
      toast.success(
        queuedOffline
          ? "Alteração salva offline — será sincronizada quando a conexão voltar."
          : "Responsável removido."
      );
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : getErrorMessage(error)),
  });
}

// Used for the section select on the item detail view and for drag-and-drop
// on the board — the target section/position is only known at call time, so
// unlike `useUpdateItemMutation` this isn't bound to one item via the hook args.
// `position` lets callers drop o item above/below a specific sibling instead
// of always appending to the end of the destination section's list.
export function useMoveItemToSectionMutation() {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationKey: ITEM_MUTATION_KEY,
    mutationFn: ({
      itemId,
      sectionId,
      position,
    }: {
      itemId: string;
      sectionId?: string;
      position?: number;
    }) => {
      const payload = { sectionId, position };
      const current = queryClient.getQueryData<Item>(queryKeys.items.detail(itemId));
      if (isOffline() && workspaceId && current) {
        return Promise.resolve(
          queueEntityUpdate({
            workspaceId,
            entityType: "ITEM",
            entityId: itemId,
            payload,
            current,
            meta: { folderId: current.folderId },
          })
        );
      }
      return itemsService.update(itemId, payload);
    },
    // Each board column is its own paginated cache (items.bySection), so a
    // cross-column move needs to be reflected in both the source and
    // destination column's cache directly — invalidateQueries alone leaves
    // the item sitting in the old column (refetch is paused while offline,
    // per networkMode: "online") instead of appearing to move at all.
    // Same-column reordering is left alone: the item never disappears there,
    // it just settles into its exact position once the next pull reconciles.
    onMutate: async ({ itemId, sectionId: toSectionId }) => {
      if (!toSectionId) return {};

      await queryClient.cancelQueries({ queryKey: queryKeys.items.bySectionAll() });

      const previousEntries = moveItemBetweenSectionCaches(queryClient, itemId, toSectionId);

      return { previousEntries };
    },
    onSuccess: (item) => {
      queryClient.setQueryData(queryKeys.items.detail(item.id), item);
      toast.success(
        isOffline()
          ? "Movimentação salva offline — será sincronizada quando a conexão voltar."
          : "Item movido."
      );
    },
    onError: (error, _vars, context) => {
      restoreSectionEntries(queryClient, context?.previousEntries);
      toast.error(getErrorMessage(error));
    },
    // On failure too, so a rollback skipped because other item writes were in
    // flight still ends up matching the server.
    onSettled: () => scheduleItemListsRefresh(queryClient),
  });
}

function pluralizeItems(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

// Per-item failures of a bulk call, as messages a person can read.
function collectBulkFailures<T>(bulk: BulkResult<T>) {
  return bulk.results.flatMap((result) =>
    result.status === "FAILED" ? [getBulkItemErrorMessage(result.error)] : []
  );
}

/**
 * Moves several items to one column with a single `PATCH /items/bulk`. With a
 * `position` each item lands at `position + index` (keeping their relative
 * order); without one they are appended to the column in the order given. The
 * server applies the items one by one and a failure doesn't undo the others, so
 * the result reports what actually moved — callers can keep just the failed
 * ones selected.
 */
export function useMoveItemsToSectionMutation() {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationKey: ITEM_MUTATION_KEY,
    mutationFn: async ({
      items,
      sectionId,
      position,
    }: {
      items: Item[];
      sectionId: string;
      position?: number;
    }) => {
      const payloadFor = (index: number) => ({
        sectionId,
        position: position === undefined ? undefined : position + index,
      });

      if (isOffline() && workspaceId) {
        for (const [index, item] of items.entries()) {
          const current = findCachedItem(queryClient, item.id) ?? item;
          const queued = queueEntityUpdate({
            workspaceId,
            entityType: "ITEM",
            entityId: item.id,
            payload: payloadFor(index),
            current,
            meta: { folderId: current.folderId },
          });
          queryClient.setQueryData(queryKeys.items.detail(item.id), queued);
        }
        return { movedIds: items.map((item) => item.id), failures: [], queuedOffline: true };
      }

      const bulk = await itemsService.bulkUpdate(
        items.map((item, index) => ({ itemId: item.id, ...payloadFor(index) }))
      );
      const movedIds: string[] = [];
      for (const result of bulk.results) {
        if (result.status !== "SUCCESS") continue;
        movedIds.push(result.data.id);
        queryClient.setQueryData(queryKeys.items.detail(result.data.id), result.data);
      }
      return { movedIds, failures: collectBulkFailures(bulk), queuedOffline: false };
    },
    onMutate: async ({ items, sectionId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.items.bySectionAll() });
      const previousEntries = items.flatMap((item) =>
        moveItemBetweenSectionCaches(queryClient, item.id, sectionId)
      );
      return { previousEntries };
    },
    onSuccess: ({ movedIds, failures, queuedOffline }) => {
      if (failures.length === 0) {
        toast.success(
          queuedOffline
            ? "Movimentação salva offline — será sincronizada quando a conexão voltar."
            : `${pluralizeItems(movedIds.length, "item movido", "itens movidos")}.`
        );
      } else if (movedIds.length === 0) {
        toast.error(failures[0]);
      } else {
        toast.warning(
          `${pluralizeItems(movedIds.length, "item movido", "itens movidos")}, mas ${pluralizeItems(failures.length, "falhou", "falharam")}: ${failures[0]}`
        );
      }
    },
    onError: (error, _vars, context) => {
      restoreSectionEntries(queryClient, context?.previousEntries);
      toast.error(getErrorMessage(error));
    },
    // Whatever happened per item, the server's view wins: this also puts back
    // the ones that failed after the optimistic move above.
    onSettled: () => scheduleItemListsRefresh(queryClient),
  });
}

/**
 * Deletes several items with a single `POST /items/bulk-delete` (a soft delete
 * that also takes every subitem along). Offline it queues one sync `DELETE` per
 * item instead. An item that's already gone (`ITEM_NOT_FOUND` — e.g. the
 * subitem of another item in the same batch, removed by the cascade) counts as
 * deleted: it's the outcome that was asked for.
 */
export function useDeleteItemsMutation() {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationKey: ITEM_MUTATION_KEY,
    mutationFn: async (items: Item[]) => {
      if (isOffline()) {
        if (!workspaceId) {
          throw new Error("Não foi possível apagar os itens: workspace indisponível.");
        }
        for (const item of items) {
          queueEntityDelete({
            workspaceId,
            entityType: "ITEM",
            entityId: item.id,
            baseVersion: (findCachedItem(queryClient, item.id) ?? item).version,
            meta: { folderId: item.folderId, itemId: item.id },
          });
        }
        return {
          deletedIds: items.map((item) => item.id),
          deletedSubitemIds: [] as string[],
          failures: [] as string[],
          queuedOffline: true,
        };
      }

      const bulk = await itemsService.bulkDelete(items.map((item) => item.id));
      const deletedIds: string[] = [];
      const deletedSubitemIds: string[] = [];
      const failures: string[] = [];
      for (const result of bulk.results) {
        if (result.status === "SUCCESS") {
          deletedIds.push(result.data.id);
          deletedSubitemIds.push(...result.data.deletedSubitemIds);
        } else if (result.error.code === "ITEM_NOT_FOUND" && result.itemId) {
          deletedIds.push(result.itemId);
        } else {
          failures.push(getBulkItemErrorMessage(result.error));
        }
      }
      return { deletedIds, deletedSubitemIds, failures, queuedOffline: false };
    },
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.items.bySectionAll() });
      const previousEntries = removeItemsFromSectionCaches(
        queryClient,
        new Set(items.map((item) => item.id))
      );
      return { previousEntries };
    },
    onSuccess: ({ deletedIds, deletedSubitemIds, failures, queuedOffline }) => {
      for (const itemId of [...deletedIds, ...deletedSubitemIds]) {
        queryClient.removeQueries({ queryKey: queryKeys.items.detail(itemId) });
      }
      if (failures.length === 0) {
        if (queuedOffline) {
          toast.success("Exclusão salva offline — será sincronizada quando a conexão voltar.");
        } else {
          toast.success(
            `${pluralizeItems(deletedIds.length, "item foi para a lixeira", "itens foram para a lixeira")}.`,
            {
              description: "Dá para restaurar pela aba Lixeira da pasta em até 30 dias.",
              action: {
                label: "Desfazer",
                onClick: () => void restoreItems(queryClient, deletedIds).then(toastRestoreResult),
              },
              duration: 8000,
            }
          );
        }
      } else if (deletedIds.length === 0) {
        toast.error(failures[0]);
      } else {
        toast.warning(
          `${pluralizeItems(deletedIds.length, "item foi para a lixeira", "itens foram para a lixeira")}, mas ${pluralizeItems(failures.length, "falhou", "falharam")}: ${failures[0]}`
        );
      }
    },
    onError: (error, _items, context) => {
      restoreSectionEntries(queryClient, context?.previousEntries);
      toast.error(getErrorMessage(error));
    },
    // Puts back whatever the server didn't actually delete, and refreshes
    // counts and the subitem lists of the parents that lost a child.
    onSettled: (_data, _error, items) =>
      scheduleItemListsRefresh(queryClient, {
        subitemParentIds: items.map((item) => item.parentItemId),
      }),
  });
}

/**
 * Takes items back out of the trash (with the subitems that went with them).
 * Used by the trash page and by the "Desfazer" button of the delete toast.
 */
async function restoreItems(queryClient: QueryClient, itemIds: string[]) {
  const failures: string[] = [];
  let restored = 0;
  for (const itemId of itemIds) {
    try {
      await itemsService.restore(itemId);
      restored += 1;
    } catch (error) {
      failures.push(getErrorMessage(error));
    }
  }
  scheduleItemListsRefresh(queryClient);
  queryClient.invalidateQueries({ queryKey: ["items", "trash"] });
  return { restored, failures };
}

function toastRestoreResult({ restored, failures }: { restored: number; failures: string[] }) {
  if (failures.length === 0) {
    toast.success(restored === 1 ? "Item restaurado." : `${restored} itens restaurados.`);
  } else if (restored === 0) {
    toast.error(failures[0]);
  } else {
    toast.warning(`${restored} restauradas, mas ${failures.length} não: ${failures[0]}`);
  }
}

export function useFolderTrashQuery(folderId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.items.trash(folderId, page),
    queryFn: () => itemsService.listTrash(folderId, { page }),
    placeholderData: (previous) => previous,
  });
}

export function useRestoreItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => restoreItems(queryClient, [itemId]),
    onSuccess: toastRestoreResult,
  });
}

/**
 * Creates several items in one folder with a single `POST .../items/bulk`.
 * Inside one column they take their positions in the order given. Resolves with
 * the raw per-item result so the caller can tell which items failed — an item
 * that failed has no id, `index` is what matches it back to the input.
 */
export function useBulkCreateItemsMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ITEM_MUTATION_KEY,
    mutationFn: (items: CreateItemRequest[]) => itemsService.bulkCreate(folderId, items),
    onSuccess: (bulk) => {
      const failures = collectBulkFailures(bulk);
      if (failures.length === 0) {
        toast.success(`${pluralizeItems(bulk.succeeded, "item criado", "itens criados")}.`);
      } else if (bulk.succeeded === 0) {
        toast.error(failures[0]);
      } else {
        toast.warning(
          `${pluralizeItems(bulk.succeeded, "item criado", "itens criados")}, mas ${pluralizeItems(failures.length, "falhou", "falharam")}: ${failures[0]}`
        );
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: (bulk) =>
      scheduleItemListsRefresh(queryClient, {
        subitemParentIds: (bulk?.results ?? []).map((result) =>
          result.status === "SUCCESS" ? result.data.parentItemId : null
        ),
      }),
  });
}

export function useChangeItemStatusMutation(
  itemId: string,
  { silent = false }: ItemMutationOptions = {}
) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationKey: ITEM_MUTATION_KEY,
    mutationFn: ({ category: _category, ...payload }: ChangeItemStatusRequest & { category?: ItemStatus }) => {
      void _category;
      const current = findCachedItem(queryClient, itemId);
      if (isOffline() && workspaceId && current) {
        // Sync only knows the three categories, not a folder's custom statuses.
        if (!payload.status) {
          throw new Error("Sem conexão: trocar para uma etapa personalizada só pode ser feito online.");
        }
        return Promise.resolve(
          queueEntityUpdate({
            workspaceId,
            entityType: "ITEM",
            entityId: itemId,
            payload: { status: payload.status },
            current,
            meta: { folderId: current.folderId },
          })
        );
      }
      return itemsService.changeStatus(itemId, payload);
    },
    // Read before the request goes out: afterwards the cache already holds DONE.
    // A custom status is resolved to its category by the caller (`category`).
    onMutate: (payload: ChangeItemStatusRequest & { category?: ItemStatus }) => ({
      completes:
        (payload.status ?? payload.category) === "DONE" &&
        findCachedItem(queryClient, itemId)?.status !== "DONE",
    }),
    onSuccess: (item, _payload, context) => {
      toastItemWarnings(item);
      const { warnings: _warnings, ...stored } = item;
      void _warnings;
      queryClient.setQueryData(queryKeys.items.detail(itemId), stored);
      if (item.parentItemId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.items.subitems(item.parentItemId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.items.subitems(item.id) });
      // Finishing an item is the moment worth marking — in every view, the
      // silent table included. Offline too: the user did finish it.
      if (context?.completes) celebrate();
      if (silent) {
        patchItemInLists(queryClient, item);
        return;
      }
      scheduleItemListsRefresh(queryClient);
      toast.success(
        isOffline()
          ? "Status salvo offline — será sincronizado quando a conexão voltar."
          : context?.completes
            ? "Item concluído. Mandou bem!"
            : "Status atualizado."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Same pattern as useUpdateItemMutation: replace the cached item detail with the
// fresh server response (participantIds already up to date) and invalidate the
// lists that embed an Item, since an item's participants don't change list
// membership but callers still expect fresh data everywhere it's rendered.
export function useAddParticipantMutation(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => itemsService.addParticipant(itemId, userId),
    onSuccess: (item) => {
      queryClient.setQueryData(queryKeys.items.detail(itemId), item);
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all(item.folderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.bySectionAll() });
      toast.success("Participante adicionado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveParticipantMutation(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => itemsService.removeParticipant(itemId, userId),
    onSuccess: (item) => {
      queryClient.setQueryData(queryKeys.items.detail(itemId), item);
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all(item.folderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.bySectionAll() });
      toast.success("Participante removido.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUploadAttachmentMutation(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => itemsService.uploadAttachment(itemId, file),
    onSuccess: (item) => {
      queryClient.setQueryData(queryKeys.items.detail(itemId), item);
      toast.success("Anexo enviado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveAttachmentMutation(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) =>
      itemsService.removeAttachment(itemId, attachmentId),
    onSuccess: (item, attachmentId) => {
      queryClient.setQueryData(queryKeys.items.detail(itemId), item);
      queryClient.removeQueries({
        queryKey: queryKeys.items.attachmentFile(itemId, attachmentId),
      });
      toast.success("Anexo removido.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useObjectUrl(blob: Blob | null | undefined, mimeType: string) {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!blob) return;
    // The API may answer with a generic content-type; browsers need the real
    // one to render PDFs/videos inline.
    const typed =
      blob.type && blob.type !== "application/octet-stream"
        ? blob
        : new Blob([blob], { type: mimeType });
    const url = URL.createObjectURL(typed);
    // Object URLs are external resources that must be revoked, so they are
    // created/cleaned up here rather than derived during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setObjectUrl(null);
    };
  }, [blob, mimeType]);

  return objectUrl;
}

/**
 * Attachment binary as an object URL ready for `<img>`/`<video>`/`<iframe>`.
 * The file endpoint is authenticated, so it can't be used as a plain `src`;
 * the Blob is cached by react-query and the object URL is revoked on unmount.
 */
export function useAttachmentFileQuery(
  itemId: string,
  attachment: Pick<Attachment, "id" | "mimeType">,
  { enabled = true }: { enabled?: boolean } = {}
) {
  const query = useQuery({
    queryKey: queryKeys.items.attachmentFile(itemId, attachment.id),
    queryFn: () => itemsService.downloadAttachment(itemId, attachment.id),
    enabled,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    retry: false,
  });

  const blob = query.data;
  const objectUrl = useObjectUrl(blob, attachment.mimeType);

  return {
    blob: blob ?? null,
    url: objectUrl,
    isLoading: query.isLoading || (!!blob && !objectUrl),
    isError: query.isError,
  };
}

/**
 * Cover image of an item as an object URL for `<img src>`, or `null` (no cover
 * / still loading — callers just render nothing in that case).
 *
 * Same auth constraint as attachments, so it's fetched as a Blob. The cache is
 * keyed by `item.version` because the URL never changes when a cover is
 * replaced; `placeholderData` keeps the old image on screen while the new
 * version's request is in flight instead of flashing empty.
 */
export function useItemCoverUrl(item: Pick<Item, "id" | "version" | "hasCover">) {
  const query = useQuery({
    queryKey: queryKeys.items.cover(item.id, item.version),
    queryFn: () => itemsService.getCover(item.id),
    enabled: item.hasCover,
    placeholderData: (previous) => previous,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    retry: false,
  });

  // Blob URLs keep the mime the server detected (jpeg/png/webp); the fallback
  // only matters if the response comes back as octet-stream.
  const objectUrl = useObjectUrl(item.hasCover ? query.data : null, "image/jpeg");

  return item.hasCover ? objectUrl : null;
}

export function useSetItemCoverMutation(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => itemsService.setCover(itemId, file),
    onSuccess: (item) => {
      queryClient.setQueryData(queryKeys.items.detail(itemId), item);
      // Cards show the cover too — patch them in place rather than refetching.
      patchItemInLists(queryClient, item);
      toast.success("Capa atualizada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveItemCoverMutation(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => itemsService.removeCover(itemId),
    onSuccess: (item) => {
      queryClient.setQueryData(queryKeys.items.detail(itemId), item);
      patchItemInLists(queryClient, item);
      queryClient.removeQueries({ queryKey: queryKeys.items.cover(itemId) });
      toast.success("Capa removida.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDownloadAttachmentMutation(itemId: string) {
  return useMutation({
    mutationFn: async ({
      attachmentId,
      fileName,
    }: {
      attachmentId: string;
      fileName: string;
    }) => {
      const blob = await itemsService.downloadAttachment(itemId, attachmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
