export interface Comment {
  id: string;
  taskId: string;
  // null for a top-level comment; otherwise the comment this one replies to.
  parentId: string | null;
  authorId: string;
  content: string;
  mentionedUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
  mentionedUserIds?: string[];
}
