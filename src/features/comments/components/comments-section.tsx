"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { formatRelativeTime } from "@/lib/format";
import { useAuth } from "@/lib/auth/auth-context";
import { useProjectPermission } from "@/features/projects/hooks/use-project-permission";
import { commentFormSchema, type CommentFormValues } from "@/features/comments/schemas";
import {
  useCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
} from "@/features/comments/hooks/use-comments";

export function CommentsSection({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId: string;
}) {
  const { userId: currentUserId } = useAuth();
  const { canManage } = useProjectPermission(projectId);
  const commentsQuery = useCommentsQuery(taskId);
  const createMutation = useCreateCommentMutation(taskId);
  const deleteMutation = useDeleteCommentMutation(taskId);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: { content: "" },
  });

  function onSubmit(values: CommentFormValues) {
    createMutation.mutate(
      { content: values.content },
      { onSuccess: () => form.reset({ content: "" }) }
    );
  }

  const comments = commentsQuery.data ?? [];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Comentários</h3>

      {commentsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : commentsQuery.isError ? (
        <ErrorState error={commentsQuery.error} onRetry={() => commentsQuery.refetch()} />
      ) : comments.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-5" />}
          title="Nenhum comentário ainda"
          description="Seja o primeiro a comentar nesta tarefa."
        />
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const canDelete = canManage || comment.authorId === currentUserId;
            return (
              <div key={comment.id} className="flex items-start gap-2.5">
                <MemberAvatar userId={comment.authorId} className="mt-0.5" />
                <div className="min-w-0 flex-1 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MemberIdLabel userId={comment.authorId} />
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    {canDelete ? (
                      <ConfirmDialog
                        trigger={
                          <Button size="icon-xs" variant="ghost">
                            <Trash2 className="text-destructive" />
                          </Button>
                        }
                        title="Apagar comentário"
                        description="Esta ação não pode ser desfeita."
                        confirmLabel="Apagar"
                        isLoading={deleteMutation.isPending}
                        onConfirm={() => deleteMutation.mutate(comment.id)}
                      />
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2 pt-1">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="Escreva um comentário…"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="icon" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </Form>
    </div>
  );
}
