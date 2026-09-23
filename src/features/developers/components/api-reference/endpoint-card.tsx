import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { CodeBlock } from "@/features/developers/components/api-reference/code-block";
import { MethodBadge, statusToneClass } from "@/features/developers/components/api-reference/method-badge";
import { InlineCodeText } from "@/features/developers/components/api-reference/inline-code-text";
import { GENERAL_ERRORS, type ApiEndpoint, type ApiParam } from "@/features/developers/lib/api-reference-data";
import { cn } from "@/lib/utils";

function ParamsTable({ title, params }: { title: string; params: ApiParam[] }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h4>
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Obrigatório</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {params.map((param) => (
              <TableRow key={param.name}>
                <TableCell className="font-mono text-xs">{param.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{param.type}</TableCell>
                <TableCell>
                  {param.required ? (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400">
                      obrigatório
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">opcional</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {param.notes ? <InlineCodeText text={param.notes} /> : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const errors = (endpoint.errorCodes ?? [])
    .map((code) => GENERAL_ERRORS.find((e) => e.code === code))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  return (
    <AccordionItem value={`${endpoint.method}-${endpoint.path}`} className="border-border/60">
      <AccordionTrigger className="gap-3 py-3 hover:no-underline">
        <MethodBadge method={endpoint.method} />
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate font-mono text-[13px] text-foreground">{endpoint.path}</span>
          <span className="block text-xs text-muted-foreground">{endpoint.summary}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pl-1">
        {endpoint.description ? (
          <p className="text-sm text-muted-foreground">
            <InlineCodeText text={endpoint.description} />
          </p>
        ) : null}

        {endpoint.bodyParams ? <ParamsTable title="Corpo da requisição" params={endpoint.bodyParams} /> : null}
        {endpoint.queryParams ? <ParamsTable title="Query params" params={endpoint.queryParams} /> : null}

        {endpoint.requestExample ? (
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Exemplo de requisição
            </h4>
            <CodeBlock code={endpoint.requestExample} language="bash" label="curl" />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Resposta{" "}
            <span className={cn("font-mono normal-case", statusToneClass(parseInt(endpoint.responseStatus, 10)))}>
              {endpoint.responseStatus}
            </span>
          </h4>
          <CodeBlock code={endpoint.responseExample} language="json" label="response" />
        </div>

        {endpoint.notes?.length ? (
          <div className="space-y-1.5 rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5">
            {endpoint.notes.map((note, i) => (
              <p key={i} className="flex gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  <InlineCodeText text={note} />
                </span>
              </p>
            ))}
          </div>
        ) : null}

        {errors.length ? (
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Erros</h4>
            <div className="flex flex-wrap gap-1.5">
              {errors.map((error) => (
                <Badge key={error.code} variant="outline" className="gap-1 font-mono text-[11px]">
                  <span className={statusToneClass(error.status)}>{error.status}</span>
                  {error.code}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </AccordionContent>
    </AccordionItem>
  );
}
