"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Download, FileUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MAX_IMPORT_BYTES } from "@/features/data-portability/api/data-portability-service";
import {
  useDataJobQuery,
  useDownloadDataJobMutation,
  usePreviewImportMutation,
  useStartExportMutation,
  useStartImportMutation,
} from "@/features/data-portability/hooks/use-data-portability";
import {
  IMPORT_FIELDS,
  type DataJobFormat,
  type ImportField,
  type ImportJobResult,
  type ImportMapping,
} from "@/types/data-job";

const FIELD_LABEL: Record<ImportField, string> = {
  title: "Título (obrigatório)",
  description: "Descrição",
  status: "Status",
  priority: "Prioridade",
  dueDate: "Prazo",
  startDate: "Início",
  assigneeEmail: "E-mail do responsável",
  section: "Coluna",
  isMilestone: "Marco",
};

const NONE = "__none__";

function JobProgress({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> {label}
    </p>
  );
}

function ExportBlock({ projectId }: { projectId: string }) {
  const [format, setFormat] = React.useState<DataJobFormat>("CSV");
  const [jobId, setJobId] = React.useState<string | null>(null);
  const exportMutation = useStartExportMutation(projectId);
  const downloadMutation = useDownloadDataJobMutation();
  const job = useDataJobQuery(jobId).data;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Exportar</h3>
        <p className="text-xs text-muted-foreground">
          Baixe as tarefas deste projeto para abrir no Excel ou guardar uma cópia.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={format} onValueChange={(v) => setFormat(v as DataJobFormat)}>
          <SelectTrigger className="w-64" aria-label="Formato">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CSV">Planilha (CSV) — só as tarefas</SelectItem>
            <SelectItem value="JSON">Cópia completa (JSON) — com colunas, comentários e dependências</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          disabled={exportMutation.isPending || job?.status === "PENDING" || job?.status === "RUNNING"}
          onClick={() => exportMutation.mutate(format, { onSuccess: (created) => setJobId(created.id) })}
        >
          <Download /> Preparar arquivo
        </Button>
      </div>
      {job && (job.status === "PENDING" || job.status === "RUNNING") ? (
        <JobProgress label="Preparando o arquivo…" />
      ) : null}
      {job?.status === "FAILED" ? (
        <p className="text-sm text-destructive">Não foi possível preparar o arquivo. {job.error ?? ""}</p>
      ) : null}
      {job?.status === "DONE" ? (
        <Button
          size="sm"
          disabled={downloadMutation.isPending}
          onClick={() =>
            downloadMutation.mutate({
              jobId: job.id,
              fileName: job.fileName ?? `projeto.${job.format.toLowerCase()}`,
            })
          }
        >
          <Download /> Baixar {job.fileName ?? "arquivo"}
        </Button>
      ) : null}
    </div>
  );
}

function ImportBlock({ projectId }: { projectId: string }) {
  const fileInput = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [mapping, setMapping] = React.useState<ImportMapping>({});
  const [skipInvalid, setSkipInvalid] = React.useState(false);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const previewMutation = usePreviewImportMutation(projectId);
  const importMutation = useStartImportMutation(projectId);
  const job = useDataJobQuery(jobId).data;
  const preview = previewMutation.data;

  function reset() {
    setFile(null);
    setMapping({});
    setSkipInvalid(false);
    setJobId(null);
    previewMutation.reset();
    importMutation.reset();
    if (fileInput.current) fileInput.current.value = "";
  }

  function choose(next: File | undefined) {
    if (!next) return;
    if (next.size > MAX_IMPORT_BYTES) {
      toast.error("O arquivo passa de 2 MB. Divida a planilha em partes menores.");
      setFile(null);
      previewMutation.reset();
      return;
    }
    setFile(next);
    setJobId(null);
    // First pass with the automatic mapping; the answer says what it recognized.
    previewMutation.mutate({ file: next }, { onSuccess: (result) => setMapping(result.mapping) });
  }

  function changeMapping(field: ImportField, column: string) {
    if (!file) return;
    const next = { ...mapping };
    if (column === NONE) delete next[field];
    else next[field] = column;
    setMapping(next);
    previewMutation.mutate({ file, mapping: next });
  }

  const result = job?.status === "DONE" ? (job.result as unknown as ImportJobResult | null) : null;
  const running = job && (job.status === "PENDING" || job.status === "RUNNING");
  const canImport =
    !!file && !!preview && !!mapping.title && preview.validRows > 0 && (preview.invalidRows === 0 || skipInvalid);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Importar</h3>
        <p className="text-xs text-muted-foreground">
          Traga tarefas de uma planilha (CSV, até 2 MB) — inclusive exportada do Asana, Jira ou
          Trello. Você confere tudo antes de importar.
        </p>
      </div>

      {result ? (
        <div className="space-y-2 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-4 text-emerald-600" />
            {result.created === 1 ? "1 tarefa importada" : `${result.created} tarefas importadas`}
            {result.skipped > 0 ? `, ${result.skipped} linhas puladas` : ""}.
          </p>
          {result.createdSections.length > 0 ? (
            <p className="text-xs text-muted-foreground">Colunas criadas: {result.createdSections.join(", ")}.</p>
          ) : null}
          <Button size="sm" variant="outline" onClick={reset}>
            Importar outro arquivo
          </Button>
        </div>
      ) : running ? (
        <JobProgress label="Importando… pode sair desta tela, a importação continua." />
      ) : (
        <>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            <FileUp /> {file ? `Trocar arquivo (${file.name})` : "Escolher arquivo"}
          </Button>
          {job?.status === "FAILED" ? (
            <p className="text-sm text-destructive">A importação falhou. {job.error ?? ""}</p>
          ) : null}
          {previewMutation.isPending && !preview ? <JobProgress label="Lendo o arquivo…" /> : null}

          {file && preview ? (
            <div className={previewMutation.isPending ? "space-y-4 opacity-60" : "space-y-4"}>
              <div className="space-y-2">
                <p className="text-sm font-medium">De qual coluna vem cada informação?</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {IMPORT_FIELDS.map((field) => (
                    <div key={field} className="flex items-center gap-2">
                      <span className="w-40 shrink-0 text-xs text-muted-foreground">{FIELD_LABEL[field]}</span>
                      <Select value={mapping[field] ?? NONE} onValueChange={(v) => changeMapping(field, v)}>
                        <SelectTrigger size="sm" className="w-full" aria-label={FIELD_LABEL[field]}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Não importar</SelectItem>
                          {preview.headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <p>
                  <span className="font-medium">{preview.validRows}</span> de {preview.totalRows} linhas
                  prontas para importar.
                </p>
                {preview.newSections.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Colunas novas que serão criadas: {preview.newSections.join(", ")}.
                  </p>
                ) : null}
                {preview.ignoredColumns.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Colunas do arquivo que ficam de fora: {preview.ignoredColumns.join(", ")}.
                  </p>
                ) : null}
              </div>

              {preview.invalidRows > 0 ? (
                <div className="space-y-2 rounded-lg border border-amber-500/40 p-3 text-sm">
                  <p className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="size-4" />
                    {preview.invalidRows === 1 ? "1 linha tem problema" : `${preview.invalidRows} linhas têm problemas`}
                  </p>
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                    {preview.errors.slice(0, 50).map((error) => (
                      <li key={error.line}>
                        Linha {error.line}: {error.messages.join("; ")}
                      </li>
                    ))}
                  </ul>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={skipInvalid} onCheckedChange={(c) => setSkipInvalid(c === true)} />
                    Importar só as linhas sem problema
                  </label>
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button
                  disabled={!canImport || importMutation.isPending}
                  onClick={() =>
                    importMutation.mutate(
                      { file, mapping, skipInvalidRows: skipInvalid },
                      { onSuccess: (created) => setJobId(created.id) }
                    )
                  }
                >
                  <Upload /> Importar {preview.invalidRows > 0 && skipInvalid ? preview.validRows : preview.totalRows} tarefas
                </Button>
                <Button variant="ghost" onClick={reset}>
                  Cancelar
                </Button>
              </div>
              {!mapping.title ? (
                <p className="text-xs text-destructive">Escolha a coluna que tem o título das tarefas.</p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export function DataPortabilitySection({ projectId }: { projectId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar e exportar</CardTitle>
        <CardDescription>Leve suas tarefas para dentro ou para fora do TaskFlow.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ImportBlock projectId={projectId} />
        <Separator />
        <ExportBlock projectId={projectId} />
      </CardContent>
    </Card>
  );
}
