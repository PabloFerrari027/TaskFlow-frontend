"use client";

import * as React from "react";
import { CheckCircle2, FileX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getErrorCode, getErrorMessage, getServerErrorMessage } from "@/lib/errors";
import {
  usePublicIntakeFormQuery,
  useSubmitIntakeFormMutation,
} from "@/features/intake-forms/hooks/use-intake-forms";
import type { PublicIntakeForm } from "@/types/intake-form";

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: PublicIntakeForm["fields"][number];
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `field-${field.key}`;
  switch (field.type) {
    case "LONG_TEXT":
      return <Textarea id={id} rows={4} maxLength={5000} required={field.required} value={value} onChange={(e) => onChange(e.target.value)} />;
    case "SELECT":
      return (
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Escolha uma opção" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    default: {
      const type = { TEXT: "text", EMAIL: "email", NUMBER: "number", DATE: "date" }[field.type] ?? "text";
      return (
        <Input
          id={id}
          type={type}
          maxLength={field.type === "TEXT" ? 500 : undefined}
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
  }
}

/** The page anyone opens from a form link — no account, no app chrome. */
export function PublicIntakeFormPage({ token }: { token: string }) {
  const formQuery = usePublicIntakeFormQuery(token);
  const submitMutation = useSubmitIntakeFormMutation(token);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [website, setWebsite] = React.useState("");

  if (formQuery.isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (formQuery.isError || !formQuery.data) {
    const notFound = getErrorCode(formQuery.error) === "INTAKE_FORM_NOT_FOUND";
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-4 py-16 text-center">
        <FileX className="size-10 text-muted-foreground" />
        <h1 className="text-lg font-semibold">
          {notFound ? "Este formulário não está disponível" : "Não foi possível abrir o formulário"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {notFound
            ? "O link pode ter sido trocado ou o formulário foi desligado. Peça um link novo a quem te enviou."
            : getErrorMessage(formQuery.error)}
        </p>
      </div>
    );
  }

  const form = formQuery.data;

  if (submitMutation.isSuccess) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-4 py-16 text-center">
        <CheckCircle2 className="size-10 text-emerald-600" />
        <h1 className="text-lg font-semibold">Recebido, obrigado!</h1>
        <p className="text-sm text-muted-foreground">Sua resposta para “{form.name}” foi enviada.</p>
        <Button
          variant="outline"
          onClick={() => {
            setAnswers({});
            submitMutation.reset();
          }}
        >
          Enviar outra resposta
        </Button>
      </div>
    );
  }

  const missing = form.fields.filter((field) => field.required && !answers[field.key]?.trim());
  const errorDetail =
    submitMutation.isError && getErrorCode(submitMutation.error) === "INVALID_FORM_SUBMISSION"
      ? getServerErrorMessage(submitMutation.error)
      : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{form.name}</CardTitle>
          {form.description ? (
            <CardDescription className="whitespace-pre-wrap">{form.description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (missing.length > 0) return;
              const payload: Record<string, unknown> = {};
              for (const field of form.fields) {
                const value = answers[field.key]?.trim();
                if (!value) continue;
                payload[field.key] = field.type === "NUMBER" ? Number(value) : value;
              }
              submitMutation.mutate({ answers: payload, website });
            }}
          >
            {form.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`field-${field.key}`}>
                  {field.label}
                  {field.required ? <span className="text-destructive"> *</span> : null}
                </Label>
                <FieldInput
                  field={field}
                  value={answers[field.key] ?? ""}
                  onChange={(value) => setAnswers((current) => ({ ...current, [field.key]: value }))}
                />
                {field.helpText ? <p className="text-xs text-muted-foreground">{field.helpText}</p> : null}
              </div>
            ))}

            {/* Anti-spam: hidden from people, bots fill it in. */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>

            {submitMutation.isError ? (
              <p className="text-sm text-destructive">
                {getErrorMessage(submitMutation.error)}
                {errorDetail ? ` (${errorDetail})` : ""}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={missing.length > 0 || submitMutation.isPending}>
              {submitMutation.isPending ? <Loader2 className="animate-spin" /> : null} Enviar
            </Button>
            <p className="text-center text-xs text-muted-foreground">Feito com TaskFlow</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
