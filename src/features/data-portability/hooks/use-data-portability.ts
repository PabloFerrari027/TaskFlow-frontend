"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { dataPortabilityService } from "@/features/data-portability/api/data-portability-service";
import { scheduleItemListsRefresh } from "@/features/items/lib/item-list-refresh";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage, getServerErrorMessage } from "@/lib/errors";
import type { DataJobFormat, ImportMapping } from "@/types/data-job";

/** Polls a job every 1.5s until it is DONE or FAILED. */
export function useDataJobQuery(jobId: string | null) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKeys.dataJobs.detail(jobId ?? ""),
    queryFn: async () => {
      const job = await dataPortabilityService.getJob(jobId!);
      // A finished import put new items (and maybe columns) in the folder.
      if (job.kind === "IMPORT" && job.status === "DONE") {
        scheduleItemListsRefresh(queryClient);
        queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(job.folderId) });
      }
      return job;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "DONE" || status === "FAILED" ? false : 1500;
    },
  });
}

function toastWithDetail(error: unknown) {
  toast.error(getErrorMessage(error), { description: getServerErrorMessage(error) ?? undefined });
}

export function usePreviewImportMutation(folderId: string) {
  return useMutation({
    mutationFn: ({ file, mapping }: { file: File; mapping?: ImportMapping }) =>
      dataPortabilityService.previewImport(folderId, file, mapping),
    onError: toastWithDetail,
  });
}

export function useStartImportMutation(folderId: string) {
  return useMutation({
    mutationFn: ({
      file,
      mapping,
      skipInvalidRows,
    }: {
      file: File;
      mapping: ImportMapping;
      skipInvalidRows: boolean;
    }) => dataPortabilityService.startImport(folderId, file, mapping, skipInvalidRows),
    onError: toastWithDetail,
  });
}

export function useStartExportMutation(folderId: string) {
  return useMutation({
    mutationFn: (format: DataJobFormat) => dataPortabilityService.startExport(folderId, format),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDownloadDataJobMutation() {
  return useMutation({
    mutationFn: async ({ jobId, fileName }: { jobId: string; fileName: string }) => {
      const blob = await dataPortabilityService.download(jobId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
