"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import {
  useCreateSectionMutation,
  useUpdateSectionMutation,
} from "@/features/sections/hooks/use-sections";
import type { Section } from "@/types/section";

const sectionFormSchema = z.object({
  name: z.string().min(1, "Informe um nome."),
});

type SectionFormValues = z.infer<typeof sectionFormSchema>;

interface SectionFormDialogProps {
  projectId: string;
  section?: Section;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SectionFormDialog({
  projectId,
  section,
  open,
  onOpenChange,
}: SectionFormDialogProps) {
  const isEditing = Boolean(section);
  const createMutation = useCreateSectionMutation(projectId);
  const updateMutation = useUpdateSectionMutation(projectId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema),
    values: { name: section?.name ?? "" },
  });

  function onSubmit(values: SectionFormValues) {
    if (isEditing && section) {
      updateMutation.mutate(
        { sectionId: section.id, payload: { name: values.name } },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(
        { name: values.name },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        }
      );
    }
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
          <DialogTitle>{isEditing ? "Renomear coluna" : "Nova coluna"}</DialogTitle>
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
                    <Input placeholder="Em progresso" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : null}
                {isEditing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
