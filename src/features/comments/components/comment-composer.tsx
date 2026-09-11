"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { commentFormSchema, type CommentFormValues } from "@/features/comments/schemas";
import { useCreateCommentMutation } from "@/features/comments/hooks/use-comments";

export function CommentComposer({ taskId }: { taskId: string }) {
  const createMutation = useCreateCommentMutation(taskId);

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2 pt-1">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Textarea rows={2} placeholder="Escreva um comentário…" {...field} />
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
  );
}
