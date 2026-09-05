"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shortenId } from "@/lib/format";
import { useAuth } from "@/lib/auth/auth-context";
import { useAssignableMembers } from "@/features/tasks/hooks/use-assignable-members";
import type { CustomFieldDefinition, CustomFieldValue } from "@/types/custom-field";

interface TaskCustomFieldValueInputProps {
  projectId: string;
  definition: CustomFieldDefinition;
  value: CustomFieldValue;
  onSave: (value: CustomFieldValue) => void;
  isSaving: boolean;
}

export function TaskCustomFieldValueInput({
  projectId,
  definition,
  value,
  onSave,
  isSaving,
}: TaskCustomFieldValueInputProps) {
  const { userId: currentUserId } = useAuth();
  const { userIds } = useAssignableMembers(projectId);
  // Parent keys this component by task+definition, so a fresh mount (and
  // thus a fresh initializer) happens whenever the underlying value's
  // identity should change — no effect needed to resync `text`.
  const [text, setText] = React.useState(value != null ? String(value) : "");

  switch (definition.type) {
    case "TEXT":
      return (
        <Input
          value={text}
          disabled={isSaving}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            if (text !== (value ?? "")) onSave(text || null);
          }}
        />
      );

    case "NUMBER":
      return (
        <Input
          type="number"
          value={text}
          disabled={isSaving}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            const num = text === "" ? null : Number(text);
            if (num !== value) onSave(num);
          }}
        />
      );

    case "DATE":
      return (
        <Input
          type="date"
          value={text}
          disabled={isSaving}
          onChange={(e) => {
            setText(e.target.value);
            onSave(e.target.value || null);
          }}
        />
      );

    case "SINGLE_SELECT":
      return (
        <Select
          value={typeof value === "string" ? value : undefined}
          disabled={isSaving}
          onValueChange={(v) => onSave(v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecionar…" />
          </SelectTrigger>
          <SelectContent>
            {(definition.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "MULTI_SELECT": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-3">
          {(definition.options ?? []).map((option) => (
            <label key={option} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={selected.includes(option)}
                disabled={isSaving}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...selected, option]
                    : selected.filter((v) => v !== option);
                  onSave(next);
                }}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    case "CHECKBOX":
      return (
        <Checkbox
          checked={Boolean(value)}
          disabled={isSaving}
          onCheckedChange={(checked) => onSave(Boolean(checked))}
        />
      );

    case "PEOPLE": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-3">
          {userIds.map((userId) => (
            <label key={userId} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={selected.includes(userId)}
                disabled={isSaving}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...selected, userId]
                    : selected.filter((v) => v !== userId);
                  onSave(next);
                }}
              />
              {userId === currentUserId ? "Você" : shortenId(userId)}
            </label>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
