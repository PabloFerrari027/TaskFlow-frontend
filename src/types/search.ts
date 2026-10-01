export const SEARCH_RESULT_TYPES = ["TASK", "COMMENT", "PROJECT"] as const;

export type SearchResultType = (typeof SEARCH_RESULT_TYPES)[number];

export interface SearchResult {
  type: SearchResultType;
  id: string;
  projectId: string;
  projectName: string;
  /** The task, for TASK and COMMENT results. */
  taskId: string | null;
  /** The task's title or the project's name. */
  title: string;
  /** Plain text around the matched words. */
  snippet: string;
  updatedAt: string;
}

export interface SearchParams {
  /** Words (prefix match, accent/case-insensitive); all of them must appear. */
  q: string;
  types?: SearchResultType[];
  /** Only this project and its sub-projects. */
  projectId?: string;
  page?: number;
  limit?: number;
}
