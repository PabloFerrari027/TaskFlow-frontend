"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useCreateSectionMutation,
  useUpdateSectionMutation,
} from "@/features/sections/hooks/use-sections";
import type { Section } from "@/types/section";

const sectionFormSchema = z.object({
  name: z.string().min(1, "Informe um nome."),
});

type SectionFormValues = z.infer<typeof sectionFormSchema>;

interface SectionFormDialogProps {
  folderId: string;
  section?: Section;
  // When set (and not editing), creates a sub-section of this section.
  parent?: Section;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SectionFormDialog({
  folderId,
  section,
  parent,
  open,
  onOpenChange,
}: SectionFormDialogProps) {
  const isEditing = Boolean(section);
  const createMutation = useCreateSectionMutation(folderId);
  const updateMutation = useUpdateSectionMutation(folderId);
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
        { name: values.name, parentId: parent?.id },
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
          <DialogTitle>
            {isEditing ? "Renomear coluna" : parent ? "Nova subcoluna" : "Nova coluna"}
          </DialogTitle>
          {!isEditing ? (
            <DialogDescription>
              {parent
                ? `Uma subcoluna aparece dentro da coluna “${parent.name}”, para separar melhor os itens dela.`
                : "Colunas ajudam a organizar os itens por etapa, como “A fazer”, “Em andamento” e “Concluído”."}
            </DialogDescription>
          ) : null}
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
                    <Input placeholder="Ex.: Em andamento" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending} loading={isPending}>
                {isEditing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
