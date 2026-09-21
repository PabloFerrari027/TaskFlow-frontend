"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MentionTextarea } from "@/components/shared/mention-textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { commentFormSchema, type CommentFormValues } from "@/features/comments/schemas";
import { useCreateCommentMutation } from "@/features/comments/hooks/use-comments";
import { useAssignableMembers } from "@/features/tasks/hooks/use-assignable-members";
import { extractMentionedUserIds } from "@/lib/mentions";

interface CommentComposerProps {
  taskId: string;
  projectId: string;
  // When set, the composer posts a reply to this comment instead of a new
  // top-level comment, and is rendered inline under it.
  parentId?: string;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

export function CommentComposer({
  taskId,
  projectId,
  parentId,
  onSubmitted,
  onCancel,
}: CommentComposerProps) {
  const createMutation = useCreateCommentMutation(taskId);
  const isReply = Boolean(parentId);
  const { userIds: memberIds } = useAssignableMembers(projectId);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: { content: "" },
  });

  function onSubmit(values: CommentFormValues) {
    const mentionedUserIds = extractMentionedUserIds(values.content, memberIds);
    createMutation.mutate(
      {
        content: values.content,
        parentId,
        mentionedUserIds: mentionedUserIds.length ? mentionedUserIds : undefined,
      },
      {
        onSuccess: () => {
          form.reset({ content: "" });
          onSubmitted?.();
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2 pt-1">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <MentionTextarea
                  projectId={projectId}
                  rows={2}
                  autoFocus={isReply}
                  placeholder={
                    isReply
                      ? "Escreva uma resposta… use @ para mencionar"
                      : "Escreva um comentário… use @ para mencionar"
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={createMutation.isPending}>
            Cancelar
          </Button>
        ) : null}
        <Button
          type="submit"
          size="icon"
          aria-label={isReply ? "Enviar resposta" : "Enviar comentário"}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </Form>
  );
}
