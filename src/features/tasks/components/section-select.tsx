"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSectionsQuery } from "@/features/sections/hooks/use-sections";

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
  const sections = sectionsQuery.data ?? [];

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione uma coluna" />
      </SelectTrigger>
      <SelectContent>
        {sections.map((section) => (
          <SelectItem key={section.id} value={section.id}>
            {section.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
