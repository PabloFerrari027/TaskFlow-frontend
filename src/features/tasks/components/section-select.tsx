"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSectionsQuery } from "@/features/sections/hooks/use-sections";
import { buildTree, flattenTree, getAncestors } from "@/lib/tree";

export function SectionSelect({
  projectId,
  value,
  onChange,
  disabled,
}: {
  projectId: string;
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const sectionsQuery = useSectionsQuery(projectId);
  // Sub-sections are listed right under their parent with the full path as the
  // label ("Backlog / Ideias"), so same-named sub-sections stay distinguishable.
  const options = React.useMemo(() => {
    const sections = sectionsQuery.data ?? [];
    return flattenTree(buildTree(sections)).map((section) => ({
      id: section.id,
      label: [...getAncestors(sections, section.id), section].map((s) => s.name).join(" / "),
    }));
  }, [sectionsQuery.data]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione uma coluna" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
