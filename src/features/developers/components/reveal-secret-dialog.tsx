"use client";

import * as React from "react";
import { AlertTriangle, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RevealSecretDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  secret: string | null;
}

/**
 * Shown right after creating/rotating an API key or a webhook signing
 * secret — the only moment the plaintext value is ever returned (API.md §
 * 22.1/22.2). Closing this dialog is the point of no return: the secret
 * can't be recovered afterward, only rotated into a new one.
 */
export function RevealSecretDialog({
  open,
  onOpenChange,
  title,
  description,
  secret,
}: RevealSecretDialogProps) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success("Copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar automaticamente. Selecione e copie manualmente.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <code className="block break-all font-mono text-sm text-foreground">{secret}</code>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Copie e guarde este valor agora. Por segurança, ele não será mostrado de novo — se
              perdê-lo, será preciso gerar um novo.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button onClick={() => onOpenChange(false)}>Já copiei, fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
