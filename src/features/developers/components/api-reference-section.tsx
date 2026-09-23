"use client";

import * as React from "react";
import {
  BarChart3,
  Bot,
  Building2,
  CreditCard,
  FolderKanban,
  KeyRound,
  ListTodo,
  LogIn,
  ShieldAlert,
  ShieldCheck,
  Webhook,
  Workflow,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion } from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CodeBlock } from "@/features/developers/components/api-reference/code-block";
import { EndpointCard } from "@/features/developers/components/api-reference/endpoint-card";
import { statusToneClass } from "@/features/developers/components/api-reference/method-badge";
import {
  API_KEY_SCOPE_ROWS,
  DELIVERY_PAYLOAD_EXAMPLE,
  ERROR_ENVELOPE_EXAMPLE,
  GENERAL_ERRORS,
  SIGNATURE_VERIFICATION_CODE,
  VALIDATION_ERROR_EXAMPLE,
  WEBHOOK_EVENT_ROWS,
  buildApiKeyEndpoints,
  buildDeliveryEndpoints,
  buildWebhookEndpoints,
  type ApiEndpoint,
} from "@/features/developers/lib/api-reference-data";
import { buildAssistantEndpoints } from "@/features/developers/lib/api-reference/assistant";
import { buildAuthEndpoints } from "@/features/developers/lib/api-reference/auth";
import { buildAutomationEndpoints } from "@/features/developers/lib/api-reference/automation";
import { buildBillingEndpoints } from "@/features/developers/lib/api-reference/billing";
import { buildDataEndpoints } from "@/features/developers/lib/api-reference/data";
import { buildCommentEndpoints, buildCustomFieldEndpoints, buildTaskEndpoints } from "@/features/developers/lib/api-reference/tasks";
import { buildProjectEndpoints } from "@/features/developers/lib/api-reference/projects";
import { buildWorkspaceEndpoints } from "@/features/developers/lib/api-reference/workspaces";

function SectionCard({
  id,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-20 space-y-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children}
    </Card>
  );
}

function EndpointGroup({ title, endpoints }: { title?: string; endpoints: ApiEndpoint[] }) {
  return (
    <div className="space-y-1.5">
      {title ? (
        <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h4>
      ) : null}
      <Accordion type="multiple" className="rounded-lg border border-border/60 px-3">
        {endpoints.map((endpoint) => (
          <EndpointCard key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />
        ))}
      </Accordion>
    </div>
  );
}

const TOC = [
  { id: "auth", label: "Autenticação e sessões" },
  { id: "workspaces", label: "Workspaces e convites" },
  { id: "projects", label: "Projetos e seções" },
  { id: "tasks", label: "Tarefas, campos e comentários" },
  { id: "data", label: "Analytics, sync e atividade" },
  { id: "realtime-automation", label: "Tempo real e automações" },
  { id: "assistant", label: "Assistente de IA" },
  { id: "api-keys", label: "Chaves de API" },
  { id: "webhooks", label: "Webhooks" },
  { id: "billing", label: "Planos e uso de IA" },
  { id: "errors", label: "Referência de erros" },
];

export function ApiReferenceSection({ workspaceId }: { workspaceId: string }) {
  const authEndpoints = React.useMemo(() => buildAuthEndpoints(), []);
  const workspaceEndpoints = React.useMemo(() => buildWorkspaceEndpoints(workspaceId), [workspaceId]);
  const projectEndpoints = React.useMemo(() => buildProjectEndpoints(workspaceId), [workspaceId]);
  const taskEndpoints = React.useMemo(() => buildTaskEndpoints(), []);
  const customFieldEndpoints = React.useMemo(() => buildCustomFieldEndpoints(), []);
  const commentEndpoints = React.useMemo(() => buildCommentEndpoints(), []);
  const dataEndpoints = React.useMemo(() => buildDataEndpoints(workspaceId), [workspaceId]);
  const automationEndpoints = React.useMemo(() => buildAutomationEndpoints(workspaceId), [workspaceId]);
  const assistantEndpoints = React.useMemo(() => buildAssistantEndpoints(workspaceId), [workspaceId]);
  const billingEndpoints = React.useMemo(() => buildBillingEndpoints(), []);
  const apiKeyEndpoints = React.useMemo(() => buildApiKeyEndpoints(workspaceId), [workspaceId]);
  const webhookEndpoints = React.useMemo(() => buildWebhookEndpoints(workspaceId), [workspaceId]);
  const deliveryEndpoints = React.useMemo(() => buildDeliveryEndpoints(workspaceId), [workspaceId]);

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">Documentação da API</h2>
          <Badge variant="secondary" className="font-mono text-[10px]">
            API.md completo
          </Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Referência técnica de toda a API REST do TaskFlow: parâmetros, exemplos de requisição e
          resposta, e códigos de erro de cada rota. A explicação conceitual de chaves de API e
          webhooks (pra que serve, quando usar) está no link &ldquo;Como funciona&rdquo; no topo da
          página — o que vem abaixo é o detalhe técnico para quem já está integrando.
        </p>
      </div>

      <Card className="flex flex-wrap gap-1.5 p-3">
        {TOC.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground underline-offset-2 hover:bg-muted hover:text-foreground hover:underline"
          >
            {item.label}
          </a>
        ))}
      </Card>

      <Card className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Antes de começar</h3>
          <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
            workspaceId = {workspaceId}
          </code>
        </div>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>
            Todas as chamadas abaixo usam a URL base da sua API (<code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">NEXT_PUBLIC_API_URL</code>, ex.: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">http://localhost:3000</code> em desenvolvimento).
          </li>
          <li>
            A maioria das rotas usa o token JWT da sua sessão em <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Authorization: Bearer &lt;seu-access-token&gt;</code>. Uma chave de API (seção &ldquo;Chaves de API&rdquo; abaixo) também autentica as rotas cobertas pelos seus escopos, com <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">Authorization: Bearer &lt;chave&gt;</code> no lugar do token.
          </li>
          <li>
            Gerenciar chaves e webhooks (criar, listar, editar, revogar) exige sempre o login normal — nunca uma chave de API — e só <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">OWNER</code>/<code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">ADMIN</code> deste workspace conseguem chamar essas rotas.
          </li>
        </ul>
        <div className="flex gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-xs text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <span>
            Uma chave de API já autentica chamadas de verdade a esta API — envie <code className="rounded bg-background/60 px-1 py-0.5 font-mono">Authorization: Bearer &lt;chave&gt;</code> no lugar do token de login em rotas como <code className="rounded bg-background/60 px-1 py-0.5 font-mono">GET /tasks</code>. Cada rota exige o escopo correspondente (ex.: uma chave só com <code className="rounded bg-background/60 px-1 py-0.5 font-mono">tasks:read</code> não consegue criar/editar tarefas), e chamadas por chave têm seu próprio limite — <strong>300 requisições / 60s por chave</strong>, independente do rate limit por IP.
          </span>
        </div>
      </Card>

      <SectionCard
        id="auth"
        icon={LogIn}
        title="Autenticação e sessões"
        description="Cadastro, login em duas etapas (senha + 2FA por e-mail), Google, senha/perfil e dispositivos logados."
      >
        <EndpointGroup endpoints={authEndpoints} />
      </SectionCard>

      <SectionCard
        id="workspaces"
        icon={Building2}
        title="Workspaces e convites"
        description="Tenant de mais alto nível: membros, papéis e convite por e-mail."
      >
        <EndpointGroup endpoints={workspaceEndpoints} />
      </SectionCard>

      <SectionCard
        id="projects"
        icon={FolderKanban}
        title="Projetos e seções"
        description="Sub-projetos de profundidade arbitrária, membros de projeto e as colunas (sections) de cada quadro."
      >
        <EndpointGroup endpoints={projectEndpoints} />
      </SectionCard>

      <SectionCard
        id="tasks"
        icon={ListTodo}
        title="Tarefas, campos personalizados e comentários"
        description="O maior grupo de rotas: CRUD de tasks, anexos, capa, operações em massa, campos personalizados e comentários com threading."
      >
        <EndpointGroup title="Tarefas" endpoints={taskEndpoints} />
        <EndpointGroup title="Campos personalizados" endpoints={customFieldEndpoints} />
        <EndpointGroup title="Comentários" endpoints={commentEndpoints} />
      </SectionCard>

      <SectionCard
        id="data"
        icon={BarChart3}
        title="Analytics, sync e atividade"
        description="Query engine para gráficos, sincronização offline-first e o histórico append-only de auditoria."
      >
        <EndpointGroup endpoints={dataEndpoints} />
      </SectionCard>

      <SectionCard
        id="realtime-automation"
        icon={Workflow}
        title="Tempo real e automações"
        description="Canal SSE de invalidação (nunca a fonte de verdade) e regras “quando X, executa Y” sem confirmação humana."
      >
        <EndpointGroup endpoints={automationEndpoints} />
      </SectionCard>

      <SectionCard
        id="assistant"
        icon={Bot}
        title="Assistente de IA"
        description="Conversa com tool calling — toda ação de escrita vira uma confirmação explícita antes de executar de verdade."
      >
        <EndpointGroup endpoints={assistantEndpoints} />
      </SectionCard>

      <SectionCard
        id="api-keys"
        icon={KeyRound}
        title="Chaves de API"
        description="Credencial de máquina do workspace — formato tfk_live_… / tfk_test_…."
      >
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Escopos concedíveis
          </h4>
          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Escopo</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {API_KEY_SCOPE_ROWS.map((row) => (
                  <TableRow key={row.scope}>
                    <TableCell className="font-mono text-xs">{row.scope}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.label}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Um valor fora desta whitelist é rejeitado com{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">400 INVALID_API_KEY_SCOPE</code>.
          </p>
        </div>

        <EndpointGroup title="Endpoints" endpoints={apiKeyEndpoints} />
      </SectionCard>

      <SectionCard
        id="webhooks"
        icon={Webhook}
        title="Webhooks"
        description="Endpoint HTTPS que recebe um POST assinado a cada evento assinável."
      >
        <div className="space-y-2">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Eventos assináveis
          </h4>
          <div className="space-y-2.5">
            {WEBHOOK_EVENT_ROWS.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="text-xs font-medium text-foreground">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.events.map(({ event, label }) => (
                    <Badge key={event} variant="outline" title={label} className="font-mono text-[11px]">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Um valor fora desta whitelist é rejeitado com{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">400 INVALID_WEBHOOK_EVENT</code>.
          </p>
        </div>

        <EndpointGroup title="Endpoints de gestão" endpoints={webhookEndpoints} />
        <EndpointGroup title="Entregas (deliveries)" endpoints={deliveryEndpoints} />

        <div className="space-y-3 border-t border-border/60 pt-4">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Formato da entrega e verificação da assinatura
          </h4>
          <CodeBlock code={DELIVERY_PAYLOAD_EXAMPLE} language="text" label="POST para a sua url" />
          <p className="text-xs text-muted-foreground">
            <code className="rounded bg-muted px-1 py-0.5 font-mono">X-TaskFlow-Signature</code> é{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">
              HMAC-SHA256(plainSigningSecret, corpo-cru-em-bytes)
            </code>
            , em hex, prefixado com <code className="rounded bg-muted px-1 py-0.5 font-mono">sha256=</code>. Recompute o
            HMAC do corpo <strong>antes</strong> de fazer <code className="rounded bg-muted px-1 py-0.5 font-mono">JSON.parse</code> e compare em tempo constante:
          </p>
          <CodeBlock code={SIGNATURE_VERIFICATION_CODE} language="js" label="verificação (Node.js)" />
          <ul className="grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
            <li>⏱️ Timeout de conexão: <strong className="text-foreground">5 segundos</strong>.</li>
            <li>🔁 Retry: até <strong className="text-foreground">5 tentativas</strong>, backoff exponencial (~2s+).</li>
            <li>
              🧮 Só o desfecho <strong className="text-foreground">final</strong> de uma entrega conta para o contador de
              falhas consecutivas.
            </li>
            <li>
              🛑 Kill switch: <strong className="text-foreground">10 falhas terminais</strong> seguidas desativam o
              endpoint sozinho (aviso por e-mail); religue com <code className="rounded bg-muted px-1 py-0.5 font-mono">PATCH … {"{"} active: true {"}"}</code>.
            </li>
          </ul>
        </div>
      </SectionCard>

      <SectionCard
        id="billing"
        icon={CreditCard}
        title="Planos e uso de IA"
        description="Teto de tokens de IA por usuário/mês e o histórico de consumo que alimenta esse teto."
      >
        <EndpointGroup endpoints={billingEndpoints} />
      </SectionCard>

      <SectionCard
        id="errors"
        icon={ShieldAlert}
        title="Referência de erros"
        description="Formato de erro e todos os códigos de negócio usados pela API."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Erro de regra de negócio
            </h4>
            <CodeBlock code={ERROR_ENVELOPE_EXAMPLE} language="json" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Erro de validação do corpo
            </h4>
            <CodeBlock code={VALIDATION_ERROR_EXAMPLE} language="json" />
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>HTTP</TableHead>
                <TableHead>Quando acontece</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GENERAL_ERRORS.map((error) => (
                <TableRow key={error.code}>
                  <TableCell className="font-mono text-xs">{error.code}</TableCell>
                  <TableCell className={`font-mono text-xs font-semibold ${statusToneClass(error.status)}`}>
                    {error.status}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{error.when}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
