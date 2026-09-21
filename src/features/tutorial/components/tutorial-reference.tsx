import { Check, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GLOSSARY,
  ROLE_COLUMNS,
  ROLE_PERMISSIONS,
} from "@/features/tutorial/lib/tutorial-reference";

export function RolesMatrix() {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">O que fazer</TableHead>
              {ROLE_COLUMNS.map(({ role, label }) => (
                <TableHead key={role} className="text-center">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROLE_PERMISSIONS.map((permission) => (
              <TableRow key={permission.action}>
                <TableCell className="whitespace-normal">{permission.action}</TableCell>
                {ROLE_COLUMNS.map(({ role, label }) => {
                  const allowed = permission.roles.includes(role);
                  return (
                    <TableCell key={role} className="text-center">
                      {allowed ? (
                        <Check
                          className="mx-auto size-4 text-emerald-600 dark:text-emerald-400"
                          aria-label={`${label}: pode`}
                        />
                      ) : (
                        <Minus
                          className="mx-auto size-4 text-muted-foreground/50"
                          aria-label={`${label}: não pode`}
                        />
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Não há papel de administrador dentro de um projeto: gerenciar um projeto depende do papel
        no workspace. O uso diário das tarefas (criar, editar, comentar) é o trabalho normal de um
        Membro; ao Convidado o servidor pode aplicar restrições, e quando algo é bloqueado o
        sistema mostra uma mensagem de permissão.
      </p>
    </div>
  );
}

export function Glossary() {
  return (
    <dl className="grid gap-x-8 gap-y-4 rounded-xl border border-border/60 bg-card/40 p-5 sm:grid-cols-2">
      {GLOSSARY.map(({ term, definition }) => (
        <div key={term} className="space-y-0.5">
          <dt className="text-sm font-medium text-foreground">{term}</dt>
          <dd className="text-sm text-muted-foreground">{definition}</dd>
        </div>
      ))}
    </dl>
  );
}
