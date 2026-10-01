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
  /** Last edit of the text by its author — `null` if never edited. */
  editedAt: string | null;
  reactions: CommentReaction[];
}

export interface CommentReaction {
  emoji: string;
  count: number;
  /** Who reacted with this emoji, in the order they did. */
  userIds: string[];
}

export interface UpdateCommentRequest {
  content: string;
  /** The COMPLETE set of mentions after the edit; omitted leaves them as they are. */
  mentionedUserIds?: string[];
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
  mentionedUserIds?: string[];
}
