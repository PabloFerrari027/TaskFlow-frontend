"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Small syntax accent, not a real highlighter — enough to make JSON/curl
// readable without pulling in a highlighting library for a handful of
// hand-written, static blocks. Escapes first so the regexes below never have
// to worry about breaking on `<`/`>`/`&` inside a value.
function highlight(rawCode: string, language: CodeBlockProps["language"]) {
  const code = escapeHtml(rawCode);
  if (language === "json") {
    return code
      .replace(/"([^"]+)":/g, '<span class="text-sky-600 dark:text-sky-400">"$1"</span>:')
      .replace(
        /: "([^"]*)"/g,
        ': <span class="text-emerald-600 dark:text-emerald-400">"$1"</span>'
      )
      .replace(
        /: (-?\d+(\.\d+)?|true|false|null)(?=[,\n]|$)/g,
        ': <span class="text-amber-600 dark:text-amber-400">$1</span>'
      );
  }
  if (language === "bash") {
    return code.replace(
      /^(curl|npm|npx)\b/gm,
      '<span class="text-emerald-600 dark:text-emerald-400">$1</span>'
    );
  }
  return code;
}

interface CodeBlockProps {
  code: string;
  language?: "json" | "bash" | "js" | "text";
  label?: string;
}

export function CodeBlock({ code, language = "text", label }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (permissions/insecure context) —
      // the copy button is a convenience, not something worth surfacing an
      // error toast for.
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#0d1117] text-[#c9d1d9]">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-3 py-1.5">
        <span className="font-mono text-[11px] tracking-wide text-white/50 uppercase">
          {label ?? language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code
          className={cn("font-mono whitespace-pre")}
          dangerouslySetInnerHTML={{ __html: highlight(code, language) }}
        />
      </pre>
    </div>
  );
}
