"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDecideApprovalMutation } from "@/features/approvals/hooks/use-approvals";

/** Approve / reject, with an optional note asked for inline. */
export function ApprovalDecisionButtons({ approvalId }: { approvalId: string }) {
  const decideMutation = useDecideApprovalMutation();
  const [note, setNote] = React.useState("");

  function decide(decision: "approve" | "reject") {
    decideMutation.mutate({ approvalId, decision, note: note.trim() || undefined });
  }

  return (
    <div className="space-y-2">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={2000}
        placeholder="Comentário (opcional)"
        aria-label="Comentário da resposta"
        className="h-8"
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={decideMutation.isPending} onClick={() => decide("approve")}>
          <Check /> Aprovar
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={decideMutation.isPending}
          onClick={() => decide("reject")}
        >
          <X /> Recusar
        </Button>
      </div>
    </div>
  );
}
