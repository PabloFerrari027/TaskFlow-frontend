"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  inviteWorkspaceMemberSchema,
  type InviteWorkspaceMemberFormValues,
} from "@/features/workspaces/schemas";
import { useInviteWorkspaceMemberMutation } from "@/features/workspaces/hooks/use-workspaces";

interface InviteMemberDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({
  workspaceId,
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const inviteMutation = useInviteWorkspaceMemberMutation(workspaceId);

  const form = useForm<InviteWorkspaceMemberFormValues>({
    resolver: zodResolver(inviteWorkspaceMemberSchema),
    defaultValues: { email: "", role: "MEMBER" },
  });

  function onSubmit(values: InviteWorkspaceMemberFormValues) {
    inviteMutation.mutate(values, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar para o workspace</DialogTitle>
          <DialogDescription>
            Um e-mail será enviado com um link de convite.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="pessoa@empresa.com" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Papel</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="MEMBER">Membro</SelectItem>
                      <SelectItem value="GUEST">Convidado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? <Loader2 className="animate-spin" /> : null}
                Enviar convite
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
