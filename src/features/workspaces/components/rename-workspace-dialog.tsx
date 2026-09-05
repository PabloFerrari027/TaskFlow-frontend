"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { workspaceNameSchema, type WorkspaceNameFormValues } from "@/features/workspaces/schemas";
import { useRenameWorkspaceMutation } from "@/features/workspaces/hooks/use-workspaces";

interface RenameWorkspaceDialogProps {
  workspaceId: string;
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameWorkspaceDialog({
  workspaceId,
  currentName,
  open,
  onOpenChange,
}: RenameWorkspaceDialogProps) {
  const renameMutation = useRenameWorkspaceMutation(workspaceId);

  const form = useForm<WorkspaceNameFormValues>({
    resolver: zodResolver(workspaceNameSchema),
    values: { name: currentName },
  });

  function onSubmit(values: WorkspaceNameFormValues) {
    renameMutation.mutate(values, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear workspace</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={renameMutation.isPending}>
                {renameMutation.isPending ? <Loader2 className="animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
