"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type DefaultValues } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getCategoryInfo } from "@/features/project-templates/lib/categories";
import { useProjectTemplateCategoriesQuery } from "@/features/project-templates/hooks/use-project-templates";
import {
  templateListingSchema,
  type TemplateListingFormValues,
} from "@/features/project-templates/schemas";
import { PROJECT_TEMPLATE_CATEGORIES } from "@/types/project-template";

interface TemplateListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  // Shown above the fields (e.g. what does and doesn't go to the hub).
  notice?: React.ReactNode;
  submitLabel: string;
  defaultValues: DefaultValues<TemplateListingFormValues>;
  isPending: boolean;
  onSubmit: (values: TemplateListingFormValues) => void;
}

export function TemplateListingDialog({
  open,
  onOpenChange,
  title,
  description,
  notice,
  submitLabel,
  defaultValues,
  isPending,
  onSubmit,
}: TemplateListingDialogProps) {
  const categoriesQuery = useProjectTemplateCategoriesQuery();
  const form = useForm<TemplateListingFormValues>({
    resolver: zodResolver(templateListingSchema),
    defaultValues,
  });
  const isPaid = useWatch({ control: form.control, name: "isPaid" });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset(defaultValues);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        {notice}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              if (!isPending) onSubmit(values);
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do modelo</FormLabel>
                  <FormControl>
                    <Input maxLength={120} autoFocus {...field} />
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
                    <Textarea
                      rows={3}
                      maxLength={2000}
                      placeholder="Para quem é este modelo e como ele ajuda?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Escolha uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROJECT_TEMPLATE_CATEGORIES.map((slug) => {
                        const info = getCategoryInfo(slug, categoriesQuery.data);
                        return (
                          <SelectItem key={slug} value={slug}>
                            <span aria-hidden>{info.icon}</span> {info.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{field.value ? "Pago" : "Grátis"}</FormLabel>
                    <FormDescription>
                      {field.value
                        ? "Quem quiser usar paga uma única vez."
                        : "Qualquer pessoa pode usar sem pagar."}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Cobrar pelo modelo"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isPaid ? (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço</FormLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>R$</InputGroupText>
                      </InputGroupAddon>
                      <FormControl>
                        <InputGroupInput inputMode="decimal" placeholder="19,90" {...field} />
                      </FormControl>
                    </InputGroup>
                    <FormDescription>Entre R$ 1,00 e R$ 1.000,00.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : null}
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
