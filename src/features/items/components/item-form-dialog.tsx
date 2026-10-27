"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { dueDateAt, timeInputValue, toDateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";
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
  // Column and assignee are rarely needed when creating: folded until asked for.
  const [showMore, setShowMore] = React.useState(isEditing);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    values: {
      title: item?.title ?? "",
      description: item?.description ?? "",
      assigneeId: item?.assigneeId ?? undefined,
      sectionId: item?.sectionId ?? sectionId ?? defaultSectionId ?? "",
      dueDate: toDateInputValue(item?.dueDate),
      dueTime: item?.dueDate && item.dueDateHasTime ? timeInputValue(item.dueDate) : "",
      priority: item?.priority ?? undefined,
      mentionedUserIds: item?.mentionedUserIds ?? [],
    },
  });
  const pickedDay = Boolean(useWatch({ control: form.control, name: "dueDate" }));

  function onSubmit(values: ItemFormValues) {
    // The mention set follows the `@Name` tokens left in the description.
    const mentionedUserIds = extractMentionedUserIds(values.description ?? "", memberIds, names);
    const dueDate = values.dueDate ? dueDateAt(values.dueDate, values.dueTime || undefined) : undefined;

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
          // An emptied field clears what the item had.
          dueDate: dueDate ?? (item.dueDate ? null : undefined),
          priority: values.priority ?? (item.priority ? null : undefined),
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
        if (!next) {
          form.reset();
          setShowMore(isEditing);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar item" : parentItemId ? "Novo subitem" : "Novo item"}
          </DialogTitle>
          {!isEditing ? (
            <DialogDescription>
              {parentItemId
                ? "O subitem será criado nesta mesma pasta."
                : "Só o título é obrigatório. O resto pode ficar para depois."}
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
                  <FormLabel>O que precisa ser feito?</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Pagar a conta de luz" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="group/details">
                  <FormLabel>Detalhes (opcional)</FormLabel>
                  <FormControl>
                    <MarkdownTextarea
                      folderId={folderId}
                      rows={3}
                      // Formatting buttons only while writing the details.
                      toolbarClassName="hidden group-focus-within/details:flex"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid content-start gap-2">
                <Label>Prazo (opcional)</Label>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="min-w-0 flex-1">
                        <FormControl>
                          <Input type="date" aria-label="Dia do prazo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueTime"
                    render={({ field }) => (
                      <FormItem className="w-28 shrink-0">
                        <FormControl>
                          <Input
                            type="time"
                            aria-label="Hora do prazo (opcional)"
                            title={pickedDay ? "Hora (opcional)" : "Escolha o dia primeiro"}
                            disabled={!pickedDay}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Sem hora, vale o dia todo.</p>
              </div>

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem className="content-start">
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
                          <SelectItem value={NO_PRIORITY_VALUE}>Sem prioridade</SelectItem>
                          {(Object.keys(ITEM_PRIORITY_LABEL) as ItemPriority[]).map((p) => (
                            <SelectItem key={p} value={p}>
                              {ITEM_PRIORITY_LABEL[p]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <Button
                type="button"
                variant="link"
                className="h-auto px-0"
                aria-expanded={showMore}
                onClick={() => setShowMore((v) => !v)}
              >
                Coluna e responsável
                <ChevronDown className={cn("transition-transform", showMore && "rotate-180")} />
              </Button>

              {showMore ? (
                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} loading={isPending}>
                {isEditing ? "Salvar" : "Criar item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
