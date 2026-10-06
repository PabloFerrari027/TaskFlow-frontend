export const SEARCH_RESULT_TYPES = ["ITEM", "COMMENT", "FOLDER"] as const;

export type SearchResultType = (typeof SEARCH_RESULT_TYPES)[number];

export interface SearchResult {
  type: SearchResultType;
  id: string;
  folderId: string;
  folderName: string;
  /** The item, for ITEM and COMMENT results. */
  itemId: string | null;
  /** The item's title or the folder's name. */
  title: string;
  /** Plain text around the matched words. */
  snippet: string;
  updatedAt: string;
}

export interface SearchParams {
  /** Words (prefix match, accent/case-insensitive); all of them must appear. */
  q: string;
  types?: SearchResultType[];
  /** Only this folder and its sub-folders. */
  folderId?: string;
  page?: number;
  limit?: number;
}
