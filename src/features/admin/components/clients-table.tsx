"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { CheckCircle2, ShieldOff, Users, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ClientStatusBadge } from "@/components/shared/status-badge";
import { Pager } from "@/components/shared/pager";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useActivateClientMutation,
  useClientsQuery,
  useCloseClientMutation,
  useSuspendClientMutation,
} from "@/features/admin/hooks/use-clients";
import type { ClientStatus } from "@/types/client";

const STATUS_FILTER_OPTIONS: { value: ClientStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos os status" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "DISABLED", label: "Suspenso" },
  { value: "CLOSED", label: "Encerrado" },
];

export function ClientsTable() {
  const router = useRouter();
  const { userId } = useAuth();
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<ClientStatus | "ALL">("ALL");
  const [emailInput, setEmailInput] = React.useState("");
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setEmail(emailInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [emailInput]);

  const clientsQuery = useClientsQuery({
    page,
    status: status === "ALL" ? undefined : status,
    email: email || undefined,
  });
  const suspendMutation = useSuspendClientMutation();
  const activateMutation = useActivateClientMutation();
  const closeMutation = useCloseClientMutation();

  React.useEffect(() => {
    if (
      clientsQuery.isError &&
      axios.isAxiosError(clientsQuery.error) &&
      clientsQuery.error.response?.status === 403
    ) {
      router.replace("/403");
    }
  }, [clientsQuery.isError, clientsQuery.error, router]);

  const clients = clientsQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por e-mail..."
          value={emailInput}
          onChange={(event) => setEmailInput(event.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as ClientStatus | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {clientsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : clientsQuery.isError ? (
        <ErrorState error={clientsQuery.error} onRetry={() => clientsQuery.refetch()} />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="Nenhum cliente encontrado"
          description="Ajuste os filtros para ver outros resultados."
        />
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-56" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const isSelf = client.id === userId;

                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium text-foreground">
                      {client.email}
                    </TableCell>
                    <TableCell>{client.role}</TableCell>
                    <TableCell>
                      <ClientStatusBadge status={client.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(client.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {client.status === "ACTIVE" ? (
                          <ConfirmDialog
                            trigger={
                              <Button variant="outline" size="sm" disabled={isSelf}>
                                <ShieldOff /> Suspender
                              </Button>
                            }
                            title="Suspender cliente"
                            description={`A conta de ${client.email} ficará suspensa até ser reativada.`}
                            confirmLabel="Suspender"
                            variant="default"
                            isLoading={suspendMutation.isPending}
                            onConfirm={() => suspendMutation.mutate(client.id)}
                          />
                        ) : null}
                        {client.status === "DISABLED" ? (
                          <ConfirmDialog
                            trigger={
                              <Button variant="outline" size="sm" disabled={isSelf}>
                                <CheckCircle2 /> Reativar
                              </Button>
                            }
                            title="Reativar cliente"
                            description={`A conta de ${client.email} voltará a ter acesso normal.`}
                            confirmLabel="Reativar"
                            variant="default"
                            isLoading={activateMutation.isPending}
                            onConfirm={() => activateMutation.mutate(client.id)}
                          />
                        ) : null}
                        {client.status !== "CLOSED" ? (
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="icon-sm" disabled={isSelf}>
                                <XCircle className="text-destructive" />
                              </Button>
                            }
                            title="Encerrar conta"
                            description={`A conta de ${client.email} será encerrada permanentemente. Essa ação não pode ser desfeita.`}
                            confirmLabel="Encerrar"
                            isLoading={closeMutation.isPending}
                            onConfirm={() => closeMutation.mutate(client.id)}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {clientsQuery.data ? (
            <Pager
              meta={clientsQuery.data.meta}
              onPageChange={setPage}
              isLoading={clientsQuery.isFetching}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
