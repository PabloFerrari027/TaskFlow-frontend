"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownTextarea } from "@/components/shared/markdown-textarea";
import { useAssignableMembers } from "@/features/items/hooks/use-assignable-members";
import { extractMentionedUserIds } from "@/lib/mentions";
import { AssigneeSelect } from "@/features/items/components/assignee-select";
import { SectionSelect } from "@/features/items/components/section-select";
import {
  NO_PRIORITY_VALUE,
  itemFormSchema,
  type ItemFormValues,
} from "@/features/items/schemas";
import {
  useCreateItemMutation,
  useUnassignItemMutation,
  useUpdateItemMutation,
} from "@/features/items/hooks/use-items";
import { useSectionsQuery } from "@/features/sections/hooks/use-sections";
import { ITEM_PRIORITY_LABEL } from "@/components/shared/status-badge";
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import type { Item, ItemPriority } from "@/types/item";

interface ItemFormDialogProps {
  folderId: string;
  item?: Item;
  parentItemId?: string;
  sectionId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemFormDialog({
  folderId,
  item,
  parentItemId,
  sectionId,
  open,
  onOpenChange,
}: ItemFormDialogProps) {
  const isEditing = Boolean(item);
  const createMutation = useCreateItemMutation(folderId);
  const updateMutation = useUpdateItemMutation(item?.id ?? "");
  const unassignMutation = useUnassignItemMutation(item?.id ?? "");
  const isPending =
    createMutation.isPending || updateMutation.isPending || unassignMutation.isPending;
  const sectionsQuery = useSectionsQuery(folderId);
  const defaultSectionId = sectionsQuery.data?.find((s) => s.isDefault)?.id;
  const { userIds: memberIds, names } = useAssignableMembers(folderId);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    values: {
      title: item?.title ?? "",
      description: item?.description ?? "",
      assigneeId: item?.assigneeId ?? undefined,
      sectionId: item?.sectionId ?? sectionId ?? defaultSectionId ?? "",
      dueDate: toDateInputValue(item?.dueDate),
      priority: item?.priority ?? undefined,
      mentionedUserIds: item?.mentionedUserIds ?? [],
    },
  });

  function onSubmit(values: ItemFormValues) {
    // The mention set follows the `@Name` tokens left in the description.
    const mentionedUserIds = extractMentionedUserIds(values.description ?? "", memberIds, names);
    const dueDate = values.dueDate ? fromDateInputValue(values.dueDate) : undefined;

    if (isEditing && item) {
      // `PATCH /items/:itemId` can't clear `assigneeId` (see
      // `useUnassignItemMutation`) — omitting it from this request would
      // silently leave the previous assignee in place, so that specific
      // change has to go through a separate call.
      const isUnassigning = Boolean(item.assigneeId) && !values.assigneeId;
      updateMutation.mutate(
        {
          title: values.title,
          description: values.description || undefined,
          assigneeId: isUnassigning ? undefined : values.assigneeId,
          sectionId: values.sectionId,
          dueDate,
          priority: values.priority,
          // Replaces the item's whole mention set, so sending it every time is safe.
          mentionedUserIds,
        },
        {
          onSuccess: () => {
            if (isUnassigning) {
              unassignMutation.mutate(undefined, { onSuccess: () => onOpenChange(false) });
            } else {
              onOpenChange(false);
            }
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          title: values.title,
          description: values.description || undefined,
          assigneeId: values.assigneeId,
          sectionId: values.sectionId,
          parentItemId,
          dueDate,
          priority: values.priority,
          mentionedUserIds: mentionedUserIds.length ? mentionedUserIds : undefined,
        },
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
            {isEditing ? "Editar item" : parentItemId ? "Novo subitem" : "Novo item"}
          </DialogTitle>
          {!isEditing ? (
            <DialogDescription>
              {parentItemId
                ? "O subitem será criado nesta mesma pasta."
                : "Crie um item nesta pasta."}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Enviar proposta ao cliente" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <MarkdownTextarea
                      folderId={folderId}
                      rows={4}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Aceita Markdown (use a barra acima). Use @ para mencionar alguém — quem for mencionado recebe um aviso por e-mail.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sectionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coluna</FormLabel>
                  <FormControl>
                    <SectionSelect
                      folderId={folderId}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <FormControl>
                    <AssigneeSelect
                      folderId={folderId}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo (opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    {item?.dueDate ? (
                      <p className="text-xs text-muted-foreground">
                        Só é possível trocar por outra data.
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade (opcional)</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? NO_PRIORITY_VALUE}
                        onValueChange={(next) =>
                          field.onChange(next === NO_PRIORITY_VALUE ? undefined : next as ItemPriority)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {!item?.priority ? (
                            <SelectItem value={NO_PRIORITY_VALUE}>Sem prioridade</SelectItem>
                          ) : null}
                          {(Object.keys(ITEM_PRIORITY_LABEL) as ItemPriority[]).map((p) => (
                            <SelectItem key={p} value={p}>
                              {ITEM_PRIORITY_LABEL[p]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {item?.priority ? (
                      <p className="text-xs text-muted-foreground">
                        Só é possível trocar por outra prioridade.
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
