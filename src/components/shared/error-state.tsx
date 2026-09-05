"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, title, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-6 py-14 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <h3 className="text-sm font-medium text-foreground">
        {title ?? "Não foi possível carregar os dados"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {error ? getErrorMessage(error) : "Tente novamente em instantes."}
      </p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCw />
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
