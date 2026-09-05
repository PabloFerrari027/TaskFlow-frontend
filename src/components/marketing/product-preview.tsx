import { Paperclip, Circle, CircleDot, CircleCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const COLUMNS = [
  {
    status: "TODO" as const,
    title: "A fazer",
    icon: Circle,
    tasks: [
      { title: "Definir escopo do onboarding", attachments: 0, tag: "Descoberta" },
      { title: "Revisar copy da landing page", attachments: 1, tag: "Marketing" },
    ],
  },
  {
    status: "IN_PROGRESS" as const,
    title: "Em progresso",
    icon: CircleDot,
    tasks: [
      { title: "Implementar convite por e-mail", attachments: 2, tag: "Backend" },
      { title: "Ajustar responsividade do dashboard", attachments: 0, tag: "Frontend" },
    ],
  },
  {
    status: "DONE" as const,
    title: "Concluída",
    icon: CircleCheck,
    tasks: [
      { title: "Configurar autenticação 2FA", attachments: 1, tag: "Segurança" },
    ],
  },
];

const COLUMN_ICON_CLASS: Record<string, string> = {
  TODO: "text-muted-foreground",
  IN_PROGRESS: "text-amber-500",
  DONE: "text-emerald-500",
};

export function ProductPreview() {
  return (
    <Card className="mt-8 w-full max-w-5xl overflow-hidden border-border/60 bg-card/60 p-0 shadow-2xl shadow-primary/5 backdrop-blur">
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
        <span className="size-2.5 rounded-full bg-destructive/50" />
        <span className="size-2.5 rounded-full bg-amber-500/50" />
        <span className="size-2.5 rounded-full bg-emerald-500/50" />
        <span className="ml-3 text-xs font-medium text-muted-foreground">
          Website Redesign · Marketing Team
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 text-left sm:grid-cols-3 sm:p-6">
        {COLUMNS.map((column) => (
          <div key={column.status} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <column.icon
                className={`size-3.5 ${COLUMN_ICON_CLASS[column.status]}`}
              />
              <span className="text-xs font-semibold text-foreground">
                {column.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {column.tasks.length}
              </span>
            </div>

            <div className="space-y-2">
              {column.tasks.map((task) => (
                <div
                  key={task.title}
                  className="rounded-lg border border-border/60 bg-background p-3 text-left shadow-sm"
                >
                  <Badge variant="outline" className="mb-2 font-normal">
                    {task.tag}
                  </Badge>
                  <p className="text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[10px]">
                        {task.tag.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {task.attachments > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="size-3" />
                        {task.attachments}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
