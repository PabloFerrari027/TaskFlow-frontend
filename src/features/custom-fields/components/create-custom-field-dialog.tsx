"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  CUSTOM_FIELD_TYPES,
  CUSTOM_FIELD_TYPE_LABEL,
  createCustomFieldSchema,
  parseOptionsText,
  type CreateCustomFieldFormValues,
} from "@/features/custom-fields/schemas";
import { useCreateCustomFieldMutation } from "@/features/custom-fields/hooks/use-custom-fields";

interface CreateCustomFieldDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCustomFieldDialog({
  projectId,
  open,
  onOpenChange,
}: CreateCustomFieldDialogProps) {
  const createMutation = useCreateCustomFieldMutation(projectId);

  const form = useForm<CreateCustomFieldFormValues>({
    resolver: zodResolver(createCustomFieldSchema),
    defaultValues: { name: "", type: "TEXT", optionsText: "" },
  });

  const type = useWatch({ control: form.control, name: "type" });
  const needsOptions = type === "SINGLE_SELECT" || type === "MULTI_SELECT";

  function onSubmit(values: CreateCustomFieldFormValues) {
    createMutation.mutate(
      {
        name: values.name,
        type: values.type,
        options: needsOptions ? parseOptionsText(values.optionsText) : undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      }
    );
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
          <DialogTitle>Novo campo personalizado</DialogTitle>
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
                    <Input placeholder="Prioridade" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CUSTOM_FIELD_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {CUSTOM_FIELD_TYPE_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {needsOptions ? (
              <FormField
                control={form.control}
                name="optionsText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opções</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={"Baixa\nMédia\nAlta"}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Uma opção por linha.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="animate-spin" /> : null}
                Criar campo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
