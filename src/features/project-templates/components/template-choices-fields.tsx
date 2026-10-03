"use client";

import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { shortenId } from "@/lib/format";
import type {
  ProjectTemplateAnchor,
  ProjectTemplateModule,
  ProjectTemplateRole,
  ProjectTemplateVariable,
  TemplateInstantiationChoices,
} from "@/types/project-template";
import type { WorkspaceMember } from "@/types/workspace";

/** What a template asks on instantiation — same in its `preview` and its `skeleton`. */
export interface TemplateQuestions {
  anchor?: ProjectTemplateAnchor | null;
  variables?: ProjectTemplateVariable[];
  roles?: ProjectTemplateRole[];
  modules?: ProjectTemplateModule[];
}

export interface TemplateChoicesValue {
  variables: Record<string, string>;
  anchorDate: string;
  enabledModules: string[];
  roleAssignments: Record<string, string>;
}

const NO_MEMBER = "__none__";

export function hasTemplateQuestions(questions: TemplateQuestions) {
  return Boolean(
    questions.anchor ||
      questions.variables?.length ||
      questions.roles?.length ||
      questions.modules?.length
  );
}

export function initialTemplateChoices(questions: TemplateQuestions): TemplateChoicesValue {
  return {
    variables: Object.fromEntries(
      (questions.variables ?? []).map((variable) => [variable.key, variable.defaultValue ?? ""])
    ),
    anchorDate: "",
    enabledModules: (questions.modules ?? [])
      .filter((module) => module.enabledByDefault)
      .map((module) => module.key),
    roleAssignments: {},
  };
}

/** Required variables still empty, by label. */
export function missingTemplateChoices(questions: TemplateQuestions, value: TemplateChoicesValue) {
  return (questions.variables ?? [])
    .filter((variable) => variable.required && !value.variables[variable.key]?.trim())
    .map((variable) => variable.label);
}

export function toChoicesRequest(
  questions: TemplateQuestions,
  value: TemplateChoicesValue
): TemplateInstantiationChoices {
  const variables = Object.fromEntries(
    Object.entries(value.variables)
      .map(([key, text]) => [key, text.trim()] as const)
      .filter(([, text]) => text !== "")
  );
  const roleAssignments = Object.fromEntries(
    Object.entries(value.roleAssignments).filter(([, userId]) => userId)
  );
  return {
    variables: Object.keys(variables).length > 0 ? variables : undefined,
    anchorDate: questions.anchor && value.anchorDate ? value.anchorDate : undefined,
    // Always sent when the template has modules, so "all off" means all off.
    enabledModules: questions.modules?.length ? value.enabledModules : undefined,
    roleAssignments: Object.keys(roleAssignments).length > 0 ? roleAssignments : undefined,
  };
}

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">{title}</legend>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {children}
    </fieldset>
  );
}

/**
 * The questions a template asks before it is used: its `{{variáveis}}`, the
 * anchor date of its deadlines, its optional modules and who takes each role.
 */
export function TemplateChoicesFields({
  questions,
  value,
  onChange,
  members,
  disabled,
  isLoading,
}: {
  questions: TemplateQuestions;
  value: TemplateChoicesValue;
  onChange: (next: TemplateChoicesValue) => void;
  members: WorkspaceMember[];
  disabled?: boolean;
  isLoading?: boolean;
}) {
  const { userId } = useAuth();

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando as opções do modelo…
      </p>
    );
  }

  const memberLabel = (member: WorkspaceMember) =>
    member.userId === userId
      ? "Você"
      : member.name?.trim() || `Usuário ${shortenId(member.userId)}…`;

  return (
    <div className="space-y-5">
      {questions.variables?.length ? (
        <Block title="Personalize" hint="Estes textos entram nos nomes das colunas e das tarefas.">
          <div className="grid gap-3 sm:grid-cols-2">
            {questions.variables.map((variable) => (
              <div key={variable.key} className="space-y-1.5">
                <Label htmlFor={`variable-${variable.key}`}>
                  {variable.label}
                  {variable.required ? <span className="text-destructive"> *</span> : null}
                </Label>
                <Input
                  id={`variable-${variable.key}`}
                  disabled={disabled}
                  value={value.variables[variable.key] ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      variables: { ...value.variables, [variable.key]: event.target.value },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </Block>
      ) : null}

      {questions.anchor ? (
        <Block
          title={questions.anchor.label}
          hint={
            questions.anchor.description ??
            "Os prazos das tarefas são contados a partir desta data. Sem ela, o modelo escolhe a primeira data em que nenhuma tarefa nasce atrasada."
          }
        >
          <Input
            type="date"
            className="w-48"
            aria-label={questions.anchor.label}
            disabled={disabled}
            value={value.anchorDate}
            onChange={(event) => onChange({ ...value, anchorDate: event.target.value })}
          />
        </Block>
      ) : null}

      {questions.modules?.length ? (
        <Block title="Partes opcionais" hint="Desmarque o que você não precisa.">
          <ul className="space-y-2">
            {questions.modules.map((module) => {
              const checked = value.enabledModules.includes(module.key);
              return (
                <li key={module.key} className="flex items-start gap-2">
                  <Checkbox
                    id={`module-${module.key}`}
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(next) =>
                      onChange({
                        ...value,
                        enabledModules: next
                          ? [...value.enabledModules, module.key]
                          : value.enabledModules.filter((key) => key !== module.key),
                      })
                    }
                  />
                  <Label htmlFor={`module-${module.key}`} className="block space-y-0.5 font-normal">
                    <span className="text-sm text-foreground">{module.label}</span>
                    {module.description ? (
                      <span className="block text-xs text-muted-foreground">{module.description}</span>
                    ) : null}
                  </Label>
                </li>
              );
            })}
          </ul>
        </Block>
      ) : null}

      {questions.roles?.length ? (
        <Block
          title="Quem faz o quê"
          hint="Cada papel vira o responsável pelas tarefas dele. Sem ninguém, elas ficam sem responsável."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {questions.roles.map((role) => (
              <div key={role.key} className="space-y-1.5">
                <Label htmlFor={`role-${role.key}`}>{role.label}</Label>
                <Select
                  disabled={disabled}
                  value={value.roleAssignments[role.key] || NO_MEMBER}
                  onValueChange={(next) =>
                    onChange({
                      ...value,
                      roleAssignments: {
                        ...value.roleAssignments,
                        [role.key]: next === NO_MEMBER ? "" : next,
                      },
                    })
                  }
                >
                  <SelectTrigger id={`role-${role.key}`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_MEMBER}>Ninguém por enquanto</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {memberLabel(member)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {role.description ? (
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Block>
      ) : null}
    </div>
  );
}

export function InstantiationProgress({
  done,
  total,
  label = "Montando o projeto…",
}: {
  done: number;
  total: number;
  label?: string;
}) {
  const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div className="space-y-1.5" role="status" aria-live="polite">
      <p className="flex items-center gap-2 text-sm text-foreground">
        <Loader2 className="size-4 animate-spin" /> {label}
        {total > 0 ? <span className="text-muted-foreground">{percent}%</span> : null}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${total > 0 ? percent : 15}%` }}
        />
      </div>
    </div>
  );
}
