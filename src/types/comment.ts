export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
}
