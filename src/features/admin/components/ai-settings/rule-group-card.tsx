"use client";

import * as React from "react";
import { Lock, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useCreateRuleMutation,
  useDeleteRuleMutation,
  useRestoreRuleMutation,
  useSetGroupEnabledMutation,
  useSetRuleEnabledMutation,
  useUpdateRuleMutation,
} from "@/features/admin/hooks/use-ai-settings";
import { RuleFormDialog } from "@/features/admin/components/ai-settings/rule-form-dialog";
import type { AiRule, AiRuleGroup } from "@/types/ai-settings";

interface RuleRowProps {
  rule: AiRule;
  planId: string;
  planName: string;
  groupOn: boolean;
  onEdit: () => void;
}

function RuleRow({ rule, planId, planName, groupOn, onEdit }: RuleRowProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const setEnabled = useSetRuleEnabledMutation();
  const restore = useRestoreRuleMutation();
  const remove = useDeleteRuleMutation();
  const ruleOn = rule.enabledByPlan[planId] ?? true;
  const editable = rule.kind === "PROMPT" && !rule.isProtected;
  // "Ver tudo" só quando as duas linhas cortaram o texto de verdade (depende da largura da tela).
  const textRef = React.useRef<HTMLParagraphElement>(null);
  const [clamped, setClamped] = React.useState(false);
  React.useLayoutEffect(() => {
    const element = textRef.current;
    if (!element || expanded) return;
    const measure = () => setClamped(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded, rule.text]);

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium text-foreground">{rule.title}</p>
          <Badge variant="outline" className="font-normal">
            {rule.kind === "PROMPT" ? "Frase" : "Trava do sistema"}
          </Badge>
          {rule.isCustomized ? <Badge variant="secondary">Texto mudado</Badge> : null}
          {!rule.isBuiltin ? <Badge variant="secondary">Criada aqui</Badge> : null}
        </div>
        <p ref={textRef} className={`mt-1 text-xs whitespace-pre-line text-muted-foreground ${expanded ? "" : "line-clamp-2"}`}>
          {rule.text}
        </p>
        {clamped || expanded ? (
          <button type="button" className="mt-0.5 text-xs font-medium text-primary hover:underline" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Mostrar menos" : "Ver tudo"}
          </button>
        ) : null}
        {rule.requires ? <p className="mt-1 text-xs text-muted-foreground">Só vale com “{rule.requires}” ligada.</p> : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {rule.isProtected ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Garantia de segurança: sempre ligada">
            <Lock className="size-3.5" /> Sempre
          </span>
        ) : (
          <Switch
            checked={groupOn && ruleOn}
            disabled={!groupOn || setEnabled.isPending}
            onCheckedChange={(enabled) => setEnabled.mutate({ planId, ruleId: rule.id, enabled })}
            aria-label={`${rule.title} no plano ${planName}`}
          />
        )}
        {editable ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Opções da regra ${rule.title}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil /> Editar
              </DropdownMenuItem>
              {rule.isCustomized ? (
                <DropdownMenuItem onSelect={() => restore.mutate(rule.id)}>
                  <RotateCcw /> Voltar ao texto original
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                <Trash2 /> Apagar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Mantém o alinhamento dos interruptores quando a linha não tem menu.
          <span className="size-7" aria-hidden />
        )}
      </div>

      <ConfirmDialog
        trigger={<span hidden />}
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Apagar esta frase?"
        description={
          rule.isBuiltin
            ? `“${rule.title}” sai de todos os planos. Ela veio pronta: se preferir só desligá-la num plano, use o interruptor.`
            : `“${rule.title}” sai de todos os planos.`
        }
        confirmLabel="Apagar"
        isLoading={remove.isPending}
        onConfirm={() => remove.mutate(rule.id, { onSuccess: () => setConfirmDelete(false) })}
      />
    </div>
  );
}

export function RuleGroupCard({ group, planId, planName }: { group: AiRuleGroup; planId: string; planName: string }) {
  const setGroupEnabled = useSetGroupEnabledMutation();
  const createRule = useCreateRuleMutation();
  const updateRule = useUpdateRuleMutation();
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<AiRule | null>(null);
  const groupOn = group.enabledByPlan[planId] ?? true;
  const offCount = group.rules.filter((rule) => !rule.isProtected && !(rule.enabledByPlan[planId] ?? true)).length;

  return (
    <Card className={groupOn ? undefined : "opacity-80"}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="flex items-center gap-2">
              {group.name}
              {group.isProtected ? <Lock className="size-4 text-muted-foreground" aria-label="Sempre ligado" /> : null}
            </CardTitle>
            <CardDescription>{group.description}</CardDescription>
            {!groupOn ? (
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Desligado no {planName}: nenhuma regra deste grupo vale.</p>
            ) : offCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {offCount} {offCount === 1 ? "regra desligada" : "regras desligadas"} no {planName}.
              </p>
            ) : null}
          </div>
          {group.isProtected ? (
            <Badge variant="secondary" className="shrink-0">
              Sempre ligado
            </Badge>
          ) : (
            <Switch
              checked={groupOn}
              disabled={setGroupEnabled.isPending}
              onCheckedChange={(enabled) => setGroupEnabled.mutate({ planId, groupKey: group.key, enabled })}
              aria-label={`Grupo ${group.name} no plano ${planName}`}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {group.rules.map((rule) => (
            <RuleRow key={rule.id} rule={rule} planId={planId} planName={planName} groupOn={groupOn} onEdit={() => setEditing(rule)} />
          ))}
        </div>
        {!group.isProtected ? (
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreating(true)}>
            <Plus /> Nova frase
          </Button>
        ) : null}
      </CardContent>

      {creating ? (
        <RuleFormDialog
          open
          onOpenChange={setCreating}
          groupName={group.name}
          isSaving={createRule.isPending}
          onSave={(input) => createRule.mutate({ groupKey: group.key, input }, { onSuccess: () => setCreating(false) })}
        />
      ) : null}
      {editing ? (
        <RuleFormDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          groupName={group.name}
          initial={{ title: editing.title, text: editing.text }}
          isSaving={updateRule.isPending}
          onSave={(input) => updateRule.mutate({ ruleId: editing.id, input }, { onSuccess: () => setEditing(null) })}
        />
      ) : null}
    </Card>
  );
}
