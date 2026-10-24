"use client";

import { Folder } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ApplyWorkspaceBlueprintRequest,
  WorkspaceBlueprint,
} from "@/types/workspace-blueprint";

export interface BlueprintSetupValue {
  variables: Record<string, string>;
  /** Optional folders left out. */
  skipFolders: string[];
}

export function initialBlueprintSetup(blueprint: WorkspaceBlueprint): BlueprintSetupValue {
  return {
    variables: Object.fromEntries(
      blueprint.variables.map((variable) => [variable.key, variable.defaultValue ?? ""])
    ),
    skipFolders: [],
  };
}

/** Labels of the required variables still empty. */
export function missingBlueprintVariables(
  blueprint: WorkspaceBlueprint,
  value: BlueprintSetupValue
) {
  return blueprint.variables
    .filter((variable) => variable.required && !value.variables[variable.key]?.trim())
    .map((variable) => variable.label);
}

// Roles, anchor dates and modules keep the blueprint's defaults.
export function toApplyRequest(value: BlueprintSetupValue): ApplyWorkspaceBlueprintRequest {
  const variables = Object.fromEntries(
    Object.entries(value.variables)
      .map(([key, text]) => [key, text.trim()] as const)
      .filter(([, text]) => text.length > 0)
  );
  return {
    variables: Object.keys(variables).length > 0 ? variables : undefined,
    skipFolders: value.skipFolders.length > 0 ? value.skipFolders : undefined,
  };
}

interface BlueprintSetupFieldsProps {
  blueprint: WorkspaceBlueprint | undefined;
  value: BlueprintSetupValue | null;
  onChange: (value: BlueprintSetupValue) => void;
  disabled?: boolean;
}

/** What the blueprint asks (its variables) and which of its folders get created. */
export function BlueprintSetupFields({
  blueprint,
  value,
  onChange,
  disabled,
}: BlueprintSetupFieldsProps) {
  if (!blueprint || !value) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const skipped = new Set(value.skipFolders);

  return (
    <div className="space-y-5">
      {blueprint.variables.map((variable) => {
        const id = `blueprint-var-${variable.key}`;
        return (
          <div key={variable.key} className="space-y-1.5">
            <Label htmlFor={id}>
              {variable.label}
              {variable.required ? null : (
                <span className="font-normal text-muted-foreground"> (opcional)</span>
              )}
            </Label>
            <Input
              id={id}
              value={value.variables[variable.key] ?? ""}
              placeholder={variable.description}
              disabled={disabled}
              maxLength={100}
              onChange={(event) =>
                onChange({
                  ...value,
                  variables: { ...value.variables, [variable.key]: event.target.value },
                })
              }
            />
          </div>
        );
      })}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Pastas que serão criadas</legend>
        <ul className="divide-y rounded-lg border">
          {blueprint.folders.map((folder) => {
            const id = `blueprint-folder-${folder.key}`;
            const included = !skipped.has(folder.key);
            return (
              <li key={folder.key} className="flex items-start gap-3 px-3 py-2.5">
                {folder.optional ? (
                  <Checkbox
                    id={id}
                    className="mt-0.5"
                    checked={included}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      onChange({
                        ...value,
                        skipFolders: checked
                          ? value.skipFolders.filter((key) => key !== folder.key)
                          : [...value.skipFolders, folder.key],
                      })
                    }
                  />
                ) : (
                  <Folder aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <label htmlFor={folder.optional ? id : undefined} className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {folder.name}
                    {folder.optional ? (
                      <span className="font-normal text-muted-foreground"> · opcional</span>
                    ) : null}
                  </span>
                  <span className="block text-xs text-muted-foreground">{folder.purpose}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>
    </div>
  );
}
