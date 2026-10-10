"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, FolderKanban, Loader2, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { MIN_SEARCH_LENGTH, useWorkspaceSearchQuery } from "@/features/search/hooks/use-search";
import type { SearchResult, SearchResultType } from "@/types/search";

const SEARCH_DELAY_MS = 250;

const GROUPS: { type: SearchResultType; heading: string; icon: React.ReactNode }[] = [
  { type: "ITEM", heading: "Itens", icon: <CheckSquare /> },
  { type: "COMMENT", heading: "Comentários", icon: <MessageSquare /> },
  { type: "FOLDER", heading: "Pastas", icon: <FolderKanban /> },
];

function resultHref(result: SearchResult) {
  if (result.type === "FOLDER") return `/folders/${result.id}/items`;
  const itemId = result.itemId ?? result.id;
  return `/folders/${result.folderId}/items?itemId=${itemId}`;
}

// Ctrl+K / ⌘K from anywhere in the app, or the button in the topbar.
export function GlobalSearch() {
  const router = useRouter();
  const { workspaceId } = useCurrentWorkspace();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const q = useDebouncedValue(text.trim(), SEARCH_DELAY_MS);
  const searchQuery = useWorkspaceSearchQuery(workspaceId, { q, limit: 30 });

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key?.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(result: SearchResult) {
    setOpen(false);
    setText("");
    router.push(resultHref(result));
  }

  const results = q.length >= MIN_SEARCH_LENGTH ? (searchQuery.data?.data ?? []) : [];
  const isSearching = searchQuery.isFetching || text.trim() !== q;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden gap-2 text-muted-foreground sm:inline-flex"
        onClick={() => setOpen(true)}
        disabled={!workspaceId}
      >
        <Search />
        <span>Buscar</span>
        <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">Ctrl K</kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        aria-label="Buscar"
        onClick={() => setOpen(true)}
        disabled={!workspaceId}
      >
        <Search />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar"
        description="Busque itens, comentários e pastas do workspace atual."
      >
        {/* The server already ranks and filters; cmdk's own filter would hide matches on the snippet. */}
        <Command shouldFilter={false}>
          <CommandInput
            value={text}
            onValueChange={setText}
            placeholder="Buscar itens, comentários e pastas…"
          />
          <CommandList className="max-h-[60vh]">
            {text.trim().length < MIN_SEARCH_LENGTH ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Digite pelo menos {MIN_SEARCH_LENGTH} letras. Não precisa acertar acentos nem
                escrever a palavra inteira.
              </p>
            ) : isSearching && results.length === 0 ? (
              <p className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Buscando…
              </p>
            ) : searchQuery.isError ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Não foi possível buscar agora. Tente de novo.
              </p>
            ) : (
              <>
                <CommandEmpty>Nada encontrado para “{q}”.</CommandEmpty>
                {GROUPS.map((group) => {
                  const items = results.filter((result) => result.type === group.type);
                  if (items.length === 0) return null;
                  return (
                    <CommandGroup key={group.type} heading={group.heading}>
                      {items.map((result) => (
                        <CommandItem
                          key={`${result.type}:${result.id}`}
                          value={`${result.type}:${result.id}`}
                          onSelect={() => go(result)}
                          className="items-start"
                        >
                          <span className="mt-0.5 text-muted-foreground">{group.icon}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{result.title}</span>
                            {result.snippet && result.snippet !== result.title ? (
                              <span className="line-clamp-2 block text-xs text-muted-foreground">
                                {result.snippet}
                              </span>
                            ) : null}
                            {result.type !== "FOLDER" ? (
                              <span className="block text-[11px] text-muted-foreground">
                                em {result.folderName}
                              </span>
                            ) : null}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })}
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
