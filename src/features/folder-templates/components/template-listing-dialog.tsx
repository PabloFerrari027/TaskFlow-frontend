"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues } from "react-hook-form";
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
import { getCategoryInfo } from "@/features/folder-templates/lib/categories";
import {
  TEMPLATE_LANGUAGE_LABEL,
  TEMPLATE_LEVEL_LABEL,
} from "@/features/folder-templates/lib/template-labels";
import { useFolderTemplateCategoriesQuery } from "@/features/folder-templates/hooks/use-folder-templates";
import {
  templateListingSchema,
  type TemplateListingFormValues,
} from "@/features/folder-templates/schemas";
import {
  FOLDER_TEMPLATE_CATEGORIES,
  FOLDER_TEMPLATE_LANGUAGES,
  FOLDER_TEMPLATE_LEVELS,
} from "@/types/folder-template";

const NO_LEVEL = "__none__";

interface TemplateListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  // Shown above the fields (e.g. what does and doesn't go into the template).
  notice?: React.ReactNode;
  submitLabel: string;
  defaultValues: DefaultValues<TemplateListingFormValues>;
  isPending: boolean;
  onSubmit: (values: TemplateListingFormValues) => void;
  /** Also tags, level, language and duration (where the API takes them). */
  withDetails?: boolean;
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
  withDetails = false,
}: TemplateListingDialogProps) {
  const categoriesQuery = useFolderTemplateCategoriesQuery();
  const form = useForm<TemplateListingFormValues>({
    resolver: zodResolver(templateListingSchema),
    defaultValues,
  });

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
                      {FOLDER_TEMPLATE_CATEGORIES.map((slug) => {
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

            {withDetails ? (
              <>
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="agência, crm, vendas" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível</FormLabel>
                        <Select
                          value={field.value || NO_LEVEL}
                          onValueChange={(value) => field.onChange(value === NO_LEVEL ? "" : value)}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NO_LEVEL}>Não informar</SelectItem>
                            {FOLDER_TEMPLATE_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {TEMPLATE_LEVEL_LABEL[level]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idioma</FormLabel>
                        <Select value={field.value ?? "pt-BR"} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FOLDER_TEMPLATE_LANGUAGES.map((language) => (
                              <SelectItem key={language} value={language}>
                                {TEMPLATE_LANGUAGE_LABEL[language]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estimatedDurationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração (dias)</FormLabel>
                        <FormControl>
                          <Input inputMode="numeric" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
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
