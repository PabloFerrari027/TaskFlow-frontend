"use client";

import * as React from "react";
import { Bookmark, ChevronDown, Save, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { useFolderPermission } from "@/features/folders/hooks/use-folder-permission";
import {
  useCreateSavedViewMutation,
  useDeleteSavedViewMutation,
  useSavedViewsQuery,
  useUpdateSavedViewMutation,
} from "@/features/items/hooks/use-saved-views";
import {
  filtersToViewConfig,
  unsavableFilterLabels,
  viewConfigToFilters,
} from "@/features/items/lib/saved-view-mapping";
import type { ItemFilters } from "@/features/items/lib/item-filters";
import type { ItemViewMode } from "@/features/items/hooks/use-item-view-mode";
import type { SavedView } from "@/types/saved-view";

function UnsavableNotice({ filters }: { filters: ItemFilters }) {
  const labels = unsavableFilterLabels(filters);
  if (labels.length === 0) return null;
  return (
    <p className="rounded-md bg-amber-500/10 px-2 py-1.5 text-xs text-amber-700 dark:text-amber-400">
      Estes filtros não ficam salvos na visão: {labels.join(", ")}.
    </p>
  );
}

/**
 * Saved combinations of filters + how the board is shown. Applying one replaces
 * the current filters; the active view can be updated with the filters on screen.
 */
export function SavedViewsMenu({
  folderId,
  filters,
  viewMode,
  onApply,
}: {
  folderId: string;
  filters: ItemFilters;
  viewMode: ItemViewMode;
  onApply: (filters: ItemFilters, viewMode: ItemViewMode) => void;
}) {
  const { userId } = useAuth();
  const { canManage } = useFolderPermission(folderId);
  const viewsQuery = useSavedViewsQuery(folderId);
  const createMutation = useCreateSavedViewMutation(folderId);
  const updateMutation = useUpdateSavedViewMutation(folderId);
  const deleteMutation = useDeleteSavedViewMutation(folderId);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [name, setName] = React.useState("");
  const [shared, setShared] = React.useState(false);

  const views = viewsQuery.data ?? [];
  const active = views.find((view) => view.id === activeId) ?? null;
  const mine = views.filter((view) => view.scope === "PERSONAL");
  const sharedViews = views.filter((view) => view.scope === "SHARED");
  const viewType = viewMode === "table" ? "TABLE" : "BOARD";

  function apply(view: SavedView) {
    setActiveId(view.id);
    onApply(viewConfigToFilters(view.config), view.viewType === "TABLE" ? "table" : "card");
  }

  function saveNew() {
    createMutation.mutate(
      {
        name: name.trim(),
        viewType,
        scope: shared ? "SHARED" : "PERSONAL",
        config: filtersToViewConfig(filters),
      },
      {
        onSuccess: (view) => {
          setActiveId(view.id);
          setSaving(false);
        },
      }
    );
  }

  // Shared views are edited by anyone in the folder; deleting one is for its
  // creator or an OWNER/ADMIN.
  const canDeleteActive = !!active && (active.ownerId === userId || (active.scope === "SHARED" && canManage));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <Bookmark /> {active ? active.name : "Visões"} <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {views.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              Salve os filtros que você usa sempre para voltar a eles com um clique.
            </p>
          ) : null}
          {mine.length > 0 ? <DropdownMenuLabel>Minhas</DropdownMenuLabel> : null}
          {mine.map((view) => (
            <DropdownMenuItem key={view.id} onSelect={() => apply(view)}>
              <Bookmark /> {view.name}
            </DropdownMenuItem>
          ))}
          {sharedViews.length > 0 ? <DropdownMenuLabel>Da pasta</DropdownMenuLabel> : null}
          {sharedViews.map((view) => (
            <DropdownMenuItem key={view.id} onSelect={() => apply(view)}>
              <Users /> {view.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setName("");
              setShared(false);
              setSaving(true);
            }}
          >
            <Save /> Salvar filtros atuais como visão…
          </DropdownMenuItem>
          {active ? (
            <>
              <DropdownMenuItem
                onSelect={() =>
                  updateMutation.mutate({
                    viewId: active.id,
                    payload: { viewType, config: filtersToViewConfig(filters) },
                  })
                }
              >
                <Save /> Atualizar “{active.name}” com os filtros atuais
              </DropdownMenuItem>
              {canDeleteActive ? (
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
                  <Trash2 /> Apagar “{active.name}”
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saving} onOpenChange={setSaving}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar visão</DialogTitle>
            <DialogDescription>
              Guarda os filtros e o modo de exibição de agora com um nome.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="view-name">Nome</Label>
              <Input
                id="view-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Minhas urgentes"
                autoFocus
              />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={shared} onCheckedChange={(checked) => setShared(checked === true)} />
              <span>
                Compartilhar com a pasta
                <span className="block text-xs text-muted-foreground">
                  Todas as pessoas da pasta veem e podem usar esta visão.
                </span>
              </span>
            </label>
            <UnsavableNotice filters={filters} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaving(false)}>
              Cancelar
            </Button>
            <Button disabled={!name.trim() || createMutation.isPending} onClick={saveNew}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        trigger={<span className="hidden" />}
        title={`Apagar a visão “${active?.name ?? ""}”?`}
        description="Só a visão é apagada; os itens não mudam."
        confirmLabel="Apagar"
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          active &&
          deleteMutation.mutate(active.id, {
            onSuccess: () => {
              setActiveId(null);
              setDeleting(false);
            },
          })
        }
      />
    </>
  );
}
