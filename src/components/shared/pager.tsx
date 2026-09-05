"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/types/common";

interface PagerProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pager({ meta, onPageChange, isLoading }: PagerProps) {
  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border/60 pt-3">
      <p className="text-xs text-muted-foreground">
        Página {meta.page} de {meta.totalPages} · {meta.total} no total
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page <= 1 || isLoading}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft /> Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.page >= meta.totalPages || isLoading}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Próxima <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
