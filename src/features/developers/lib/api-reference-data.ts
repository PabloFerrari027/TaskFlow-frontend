import {
  API_KEY_SCOPES,
  API_KEY_SCOPE_LABEL,
  WEBHOOK_EVENT_GROUPS,
  WEBHOOK_EVENT_LABEL,
} from "@/features/developers/lib/developer-catalog";

// Structured mirror of the backend's API.md, used to render
// `ApiReferenceSection` as real UI (badges, tables, accordions) instead of a
// markdown dump. Keep both in sync by hand — there is no endpoint that
// exposes this shape at runtime.
//
// This file owns the shared types + the full error code table (API.md § 1.2),
// plus the API key/webhook endpoints (§ 22, the only resource an API key can
// itself manage). Every other resource (auth, workspaces, projects, tasks,
// etc.) lives in sibling files under `./api-reference/` and imports the types
// + `GENERAL_ERRORS` from here — see `api-reference-section.tsx` for how they
// all come together on the page.

export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  notes?: string;
}

export interface ApiErrorCode {
  code: string;
  status: number;
  when: string;
}

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  description?: string;
  bodyParams?: ApiParam[];
  queryParams?: ApiParam[];
  requestExample?: string;
  responseStatus: string;
  responseExample: string;
  notes?: string[];
  errorCodes?: string[];
}

// Tabela completa de códigos de erro de negócio (API.md § 1.2) — todo
// `errorCodes` de qualquer endpoint, de qualquer resource, referencia este
// array por `code`. Erros sem entrada aqui simplesmente não geram badge (ver
// `EndpointCard`), então todo código novo documentado precisa ser somado
// aqui também.
export const GENERAL_ERRORS: ApiErrorCode[] = [
  { code: "Unauthorized", status: 401, when: "Token JWT ausente, inválido ou expirado — renove a sessão (`POST /auth/refresh`)." },
  { code: "INVALID_CREDENTIALS", status: 401, when: "E-mail/senha incorretos, ou rate limit de login por e-mail excedido (mesma resposta, de propósito)." },
  { code: "USER_ALREADY_EXISTS", status: 409, when: "`POST /auth/register` com um e-mail já cadastrado." },
  { code: "CHALLENGE_NOT_FOUND", status: 404, when: "`challengeId` inexistente em `POST /auth/login/verify`." },
  { code: "CHALLENGE_EXPIRED", status: 410, when: "Desafio de 2FA expirado — refaça `POST /auth/login`." },
  { code: "CHALLENGE_INVALID_CODE", status: 401, when: "Código de 2FA incorreto." },
  { code: "CHALLENGE_MAX_ATTEMPTS_EXCEEDED", status: 429, when: "Tentativas de código 2FA esgotadas — força novo login." },
  { code: "SESSION_NOT_FOUND", status: 404, when: "Sessão inexistente, já revogada, ou refresh token reutilizado." },
  { code: "SESSION_EXPIRED", status: 401, when: "Sessão expirada ao tentar `POST /auth/refresh`." },
  { code: "USER_NOT_FOUND", status: 404, when: "Usuário do token/id não existe (conta pode ter sido encerrada)." },
  { code: "USER_ALREADY_CLOSED", status: 409, when: "Ação num usuário cuja conta já está `CLOSED`." },
  { code: "EMAIL_NOT_VERIFIED", status: 403, when: "Login com credenciais corretas, mas a conta ainda é `PENDING_VERIFICATION`." },
  { code: "EMAIL_ALREADY_VERIFIED", status: 409, when: "`verify-email`/`resend-verification-code` numa conta que não está `PENDING_VERIFICATION`." },
  { code: "EMAIL_VERIFICATION_NOT_FOUND", status: 404, when: "`verify-email` sem nenhum desafio pendente (expirado/nunca enviado)." },
  { code: "EMAIL_VERIFICATION_EXPIRED", status: 410, when: "Código de verificação de cadastro expirado." },
  { code: "EMAIL_VERIFICATION_INVALID_CODE", status: 401, when: "Código de verificação de cadastro incorreto." },
  { code: "EMAIL_VERIFICATION_MAX_ATTEMPTS_EXCEEDED", status: 429, when: "Tentativas esgotadas — peça um código novo." },
  { code: "INVALID_USER_NAME", status: 400, when: "`name` vazio (após trim) ou maior que 100 caracteres." },
  { code: "INVALID_USER_PHOTO", status: 400, when: "Arquivo vazio, acima de 5MB, ou que não é JPEG/PNG/WebP." },
  { code: "USER_PHOTO_NOT_FOUND", status: 404, when: "O usuário existe mas não tem foto de perfil." },
  { code: "TOO_MANY_VERIFICATION_REQUESTS", status: 429, when: "Limite de reenvio de código de verificação por e-mail excedido." },
  { code: "INVALID_PASSWORD_RESET_TOKEN", status: 400, when: "Token de redefinição de senha inexistente, expirado, usado ou substituído." },
  { code: "TOO_MANY_PASSWORD_RESET_REQUESTS", status: 429, when: "Limite de `forgot-password` por e-mail excedido (3 a cada 10 min)." },
  { code: "TOO_MANY_PASSWORD_ATTEMPTS", status: 429, when: "Limite por conta de troca/definição de senha excedido (5 a cada 10 min)." },
  { code: "ACCOUNT_HAS_NO_PASSWORD", status: 409, when: "Conta só-Google tentando trocar senha, ou vincular Google sem ter senha." },
  { code: "ACCOUNT_ALREADY_HAS_PASSWORD", status: 409, when: "`POST /auth/password` numa conta que já tem senha — use `PATCH`." },
  { code: "CURRENT_PASSWORD_INCORRECT", status: 401, when: "`currentPassword` não confere (não significa sessão expirada)." },
  { code: "NO_IDENTITY_METHOD_AVAILABLE", status: 409, when: "Conta sem senha e sem Google vinculado (dado legado inconsistente)." },
  { code: "INVALID_GOOGLE_TOKEN", status: 401, when: "ID Token do Google inválido/expirado, e-mail não verificado, ou de outra conta." },
  { code: "GOOGLE_ACCOUNT_ALREADY_LINKED", status: 409, when: "O Google (ou e-mail) do token já pertence a outra conta." },
  { code: "ACCOUNT_ALREADY_HAS_GOOGLE", status: 409, when: "A conta já tem um Google vinculado (não há como trocar/remover)." },
  { code: "WORKSPACE_NOT_FOUND", status: 404, when: "Workspace inexistente, ou o usuário não tem acesso a ele." },
  { code: "FORBIDDEN_WORKSPACE_ACTION", status: 403, when: "Quem chama não tem o papel necessário no workspace/projeto para essa ação." },
  { code: "MEMBER_ALREADY_EXISTS", status: 409, when: "Usuário já é membro do workspace/projeto." },
  { code: "MEMBER_NOT_FOUND", status: 404, when: "Membro inexistente no workspace/projeto." },
  { code: "LAST_OWNER_CANNOT_BE_REMOVED", status: 409, when: "Remover/rebaixar o único `OWNER` restante do workspace." },
  { code: "WORKSPACE_NOT_EMPTY", status: 409, when: "Excluir um workspace que ainda tem outros membros além do `OWNER` solicitante." },
  { code: "INVITATION_NOT_FOUND", status: 404, when: "Convite inexistente (id ou token)." },
  { code: "INVITATION_ALREADY_PROCESSED", status: 409, when: "Convite já aceito ou revogado." },
  { code: "INVITATION_EXPIRED", status: 410, when: "Convite expirado (TTL padrão de 7 dias)." },
  { code: "INVITATION_EMAIL_MISMATCH", status: 403, when: "Aceitar um convite logado com e-mail diferente do convidado." },
  { code: "PROJECT_NOT_FOUND", status: 404, when: "Projeto inexistente, arquivado quando não deveria, ou sem acesso." },
  { code: "TASK_NOT_FOUND", status: 404, when: "Task inexistente ou já removida (soft delete)." },
  { code: "ATTACHMENT_NOT_FOUND", status: 404, when: "Anexo inexistente nessa task." },
  { code: "INVALID_TASK_COVER", status: 400, when: "Arquivo de capa vazio, acima de 10MB, ou que não é JPEG/PNG/WebP." },
  { code: "TASK_COVER_NOT_FOUND", status: 404, when: "A task existe mas não tem capa." },
  { code: "BULK_BATCH_TOO_LARGE", status: 400, when: "Mais de 100 itens num endpoint `bulk`." },
  { code: "SUBTASK_PROJECT_MISMATCH", status: 400, when: "`parentTaskId` aponta para uma task de outro projeto." },
  { code: "CANNOT_BE_OWN_PARENT", status: 400, when: "Mover um Project/Section/Task para si mesmo." },
  { code: "CANNOT_MOVE_INTO_OWN_DESCENDANT", status: 400, when: "Mover algo para dentro de um descendente dele (fecharia um ciclo)." },
  { code: "PARENT_OUT_OF_SCOPE", status: 400, when: "O novo pai é de outro workspace/projeto/task — reparentar nunca cruza escopo." },
  { code: "PROJECT_HAS_CHILDREN", status: 409, when: "Arquivar um projeto que ainda tem sub-projetos ativos." },
  { code: "PARENT_PROJECT_ARCHIVED", status: 409, when: "Criar/mover um projeto para dentro de um projeto arquivado." },
  { code: "SECTION_HAS_CHILDREN", status: 409, when: "Apagar uma section que ainda tem sub-seções." },
  { code: "COMMENT_HAS_CHILDREN", status: 409, when: "Apagar um comentário que ainda tem respostas." },
  { code: "TASK_HAS_PENDING_SUBTASKS", status: 409, when: "Concluir (`DONE`) uma task com subtasks ainda pendentes." },
  { code: "SECTION_NOT_FOUND", status: 404, when: "Section inexistente, ou nenhuma section padrão disponível ainda." },
  { code: "SECTION_PROJECT_MISMATCH", status: 400, when: "`sectionId` pertence a um projeto diferente do da task." },
  { code: "DEFAULT_SECTION_NOT_DELETABLE", status: 409, when: "Tentar apagar a section padrão (`isDefault: true`) de um projeto." },
  { code: "SECTION_NOT_EMPTY", status: 409, when: "Apagar uma section que ainda tem tasks." },
  { code: "ASSIGNEE_NOT_PROJECT_MEMBER", status: 400, when: "`assigneeId`/participante informado não tem acesso ao projeto." },
  { code: "MENTIONED_USER_NOT_PROJECT_MEMBER", status: 400, when: "Um `mentionedUserIds` não tem acesso ao projeto." },
  { code: "CUSTOM_FIELD_NOT_FOUND", status: 404, when: "Definição de campo personalizado inexistente." },
  { code: "CUSTOM_FIELD_VALUE_INVALID", status: 400, when: "Valor incompatível com o `type` do campo personalizado." },
  { code: "SYNC_VERSION_CONFLICT", status: 409, when: "`baseVersion` de uma operação de sync está desatualizado (ver `status: CONFLICT`)." },
  { code: "SYNC_BATCH_TOO_LARGE", status: 400, when: "`POST /sync/push` com mais de 100 operações." },
  { code: "CLIENT_NOT_FOUND", status: 404, when: "`userId`/`clientId` inexistente (platform admin)." },
  { code: "CANNOT_MODIFY_OWN_ACCOUNT", status: 403, when: "Um `SUPER_ADMIN` tentando suspender/encerrar a própria conta." },
  { code: "COMMENT_NOT_FOUND", status: 404, when: "Comentário inexistente." },
  { code: "COMMENT_CONTENT_INVALID", status: 400, when: "Comentário vazio (só espaços) ou maior que 5000 caracteres." },
  { code: "COMMENT_AUTHOR_MISMATCH", status: 403, when: "Apagar comentário de outro autor sem ser `OWNER`/`ADMIN` do workspace." },
  { code: "INVALID_ANALYTICS_QUERY", status: 400, when: "Entidade/campo/operador/métrica fora da whitelist de analytics." },
  { code: "UNSUPPORTED_DERIVED_METRIC", status: 400, when: "`metrics[].name` fora da whitelist de métricas derivadas." },
  { code: "INVALID_AUTOMATION_TRIGGER", status: 400, when: "Evento/campo/operador/valor do gatilho fora da whitelist de automações." },
  { code: "INVALID_AUTOMATION_ACTION", status: 400, when: "Ação inexistente/não permitida, `params` inválidos, ou placeholder que o evento não tem." },
  { code: "AUTOMATION_RULE_NOT_FOUND", status: 404, when: "Regra de automação inexistente ou de outro workspace." },
  { code: "API_KEY_NOT_FOUND", status: 404, when: "Chave inexistente ou de outro workspace." },
  { code: "INVALID_API_KEY_SCOPE", status: 400, when: "Um item de `scopes` está fora da whitelist de escopos." },
  { code: "WEBHOOK_ENDPOINT_NOT_FOUND", status: 404, when: "Endpoint inexistente ou de outro workspace." },
  { code: "WEBHOOK_DELIVERY_NOT_FOUND", status: 404, when: "Entrega inexistente ou de outro endpoint." },
  { code: "WEBHOOK_ENDPOINT_URL_NOT_ALLOWED", status: 400, when: "`url` não é https, ou resolve para IP privado/loopback/link-local/metadados (SSRF)." },
  { code: "INVALID_WEBHOOK_EVENT", status: 400, when: "Um item de `events` está fora da whitelist de eventos." },
  { code: "AI_TRANSLATION_FAILED", status: 502, when: "Falha/timeout ao chamar o modelo de IA em `POST /analytics/query/natural-language`." },
  { code: "AI_INSUFFICIENT_CREDITS", status: 402, when: "O provedor de IA recusou a chamada por falta de créditos/cota da plataforma." },
  { code: "AI_RATE_LIMIT_EXCEEDED", status: 429, when: "Limite de traduções de linguagem natural por usuário excedido." },
  { code: "AI_ASSISTANT_RATE_LIMIT_EXCEEDED", status: 429, when: "Limite de mensagens ao assistente por usuário excedido." },
  { code: "AI_ASSISTANT_TRANSLATION_FAILED", status: 502, when: "Falha/timeout ao chamar o modelo de IA em `POST /assistant/chat`." },
  { code: "PENDING_ACTION_NOT_FOUND", status: 404, when: "Ação pendente inexistente, já processada, ou de outra sessão." },
  { code: "PENDING_ACTION_EXPIRED", status: 410, when: "TTL de 2 minutos da ação pendente já venceu." },
  { code: "REAUTHENTICATION_REQUIRED", status: 401, when: "Ação crítica do assistente confirmada sem `reauth` válido." },
  { code: "ASSISTANT_DISABLED_FOR_WORKSPACE", status: 403, when: "Workspace com o assistente desligado (manual ou por kill switch)." },
  { code: "ASSISTANT_ATTACHMENT_TOO_LARGE", status: 413, when: "Um anexo isolado do chat passou do teto de tamanho por arquivo." },
  { code: "ASSISTANT_ATTACHMENTS_TOO_LARGE", status: 413, when: "A soma dos anexos passou do orçamento de envio inline ao provedor." },
  { code: "ASSISTANT_TOO_MANY_ATTACHMENTS", status: 422, when: "Mais arquivos que o limite por mensagem." },
  { code: "ASSISTANT_AUDIO_TOO_LONG", status: 422, when: "Anexo de áudio mais longo que o limite configurado." },
  { code: "ASSISTANT_TRANSCRIPTION_FAILED", status: 502, when: "Falha do provedor ao transcrever um anexo de áudio." },
  { code: "ASSISTANT_EMPTY_TRANSCRIPTION", status: 422, when: "Áudio sem fala reconhecível e sem `message` de texto." },
  { code: "REALTIME_TICKET_INVALID", status: 401, when: "Ticket de `GET /realtime/stream` inexistente, expirado (30s) ou já usado." },
  { code: "TOKEN_QUOTA_EXCEEDED", status: 429, when: "Cota de tokens de IA do plano do usuário esgotada (dia, semana ou mês)." },
  { code: "PLAN_NOT_FOUND", status: 404, when: "`planId` inexistente." },
  { code: "PLAN_NAME_ALREADY_EXISTS", status: 409, when: "Já existe um plano com esse `name` (`POST /admin/plans`)." },
  { code: "AI_USAGE_INVALID_RANGE", status: 400, when: "`from` posterior a `to`, ou intervalo maior que 90 dias." },
];

export function buildApiKeyEndpoints(workspaceId: string): ApiEndpoint[] {
  const base = `/workspaces/${workspaceId}/api-keys`;
  return [
    {
      method: "POST",
      path: base,
      summary: "Criar uma chave",
      description:
        "Cria uma credencial de máquina para autenticar chamadas diretamente à API, no lugar de um token JWT de login. Pertence ao workspace, não a uma pessoa — continua funcionando normalmente mesmo se quem criou sair do workspace.",
      bodyParams: [
        { name: "name", type: "string", required: true, notes: "1 a 120 caracteres" },
        { name: "description", type: "string", required: false, notes: "até 500 caracteres" },
        {
          name: "scopes",
          type: "string[]",
          required: true,
          notes: "1 ou mais, da tabela de escopos abaixo",
        },
        {
          name: "environment",
          type: '"LIVE" | "TEST"',
          required: false,
          notes: 'padrão "LIVE"',
        },
        { name: "expiresAt", type: "string (ISO 8601)", required: false },
      ],
      requestExample: [
        `curl -X POST "$API_URL${base}" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{",
        '    "name": "Integração com planilha de vendas",',
        '    "scopes": ["tasks:read", "projects:read"],',
        '    "environment": "LIVE"',
        "  }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: [
        "{",
        '  "id": "3d6f9e2a-...",',
        `  "workspaceId": "${workspaceId}",`,
        '  "name": "Integração com planilha de vendas",',
        '  "description": null,',
        '  "environment": "LIVE",',
        '  "keyPrefix": "tfk_live_ab12cd34",',
        '  "scopes": ["tasks:read", "projects:read"],',
        '  "createdBy": "9c2e1b7a-...",',
        '  "lastUsedAt": null,',
        '  "expiresAt": null,',
        '  "revokedAt": null,',
        '  "createdAt": "2026-09-22T12:00:00.000Z",',
        '  "updatedAt": "2026-09-22T12:00:00.000Z",',
        '  "plainKey": "tfk_live_ab12cd34ef56gh78ij90kl12mn34op56qr78st90uv12wx34yz56"',
        "}",
      ].join("\n"),
      notes: [
        "`plainKey` só aparece nesta resposta e na de rotação — copie agora, ele nunca mais é devolvido.",
        '`environment` (`LIVE`/`TEST`) é só uma convenção de nomenclatura/exibição, igual ao Stripe: uma chave `tfk_test_...` tem exatamente os mesmos escopos, os mesmos limites e o mesmo acesso de leitura/escrita que uma `tfk_live_...` equivalente. Não é isolamento de segurança entre ambientes.',
      ],
      errorCodes: ["INVALID_API_KEY_SCOPE", "FORBIDDEN_WORKSPACE_ACTION"],
    },
    {
      method: "GET",
      path: `${base}?page=1&limit=20`,
      summary: "Listar chaves",
      description:
        "Paginado. Retorna todas as chaves do workspace, revogadas ou não, mais recentes primeiro — nenhuma delas traz `plainKey`. Não é cacheado: `lastUsedAt` é atualizado a cada requisição autenticada por aquela chave, fora do ciclo desta listagem.",
      queryParams: [
        { name: "page", type: "number", required: false, notes: "padrão 1" },
        { name: "limit", type: "number", required: false, notes: "padrão 20, máx. 100" },
      ],
      requestExample: [
        `curl "$API_URL${base}?page=1&limit=20" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: [
        "{",
        '  "data": [',
        '    { "id": "...", "name": "CI pipeline", "keyPrefix": "tfk_live_ab12cd34", "scopes": ["tasks:read"], "lastUsedAt": "2026-09-22T10:00:00.000Z", "revokedAt": null, "...": "..." }',
        "  ],",
        '  "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }',
        "}",
      ].join("\n"),
      errorCodes: ["FORBIDDEN_WORKSPACE_ACTION"],
    },
    {
      method: "PATCH",
      path: `${base}/:apiKeyId`,
      summary: "Editar uma chave",
      description:
        "Atualiza nome, descrição, escopos e/ou data de validade de uma chave já existente. Nenhum campo é obrigatório — envie só o que quer mudar.",
      bodyParams: [
        { name: "name", type: "string", required: false },
        { name: "description", type: "string", required: false },
        {
          name: "scopes",
          type: "string[]",
          required: false,
          notes: "substitui o array inteiro, nunca faz merge",
        },
        { name: "expiresAt", type: "string (ISO 8601)", required: false },
      ],
      requestExample: [
        `curl -X PATCH "$API_URL${base}/3d6f9e2a-..." \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        '  -d \'{ "scopes": ["tasks:read", "tasks:write"] }\'',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "id": "3d6f9e2a-...", "scopes": ["tasks:read", "tasks:write"], "...": "..." }',
      notes: ["Não é possível reativar uma chave revogada por aqui — revogação é definitiva."],
      errorCodes: ["API_KEY_NOT_FOUND", "INVALID_API_KEY_SCOPE"],
    },
    {
      method: "POST",
      path: `${base}/:apiKeyId/rotate`,
      summary: "Girar (gerar novo segredo)",
      description:
        "Sem corpo. Gera um segredo novo e invalida o antigo imediatamente, sem janela de sobreposição — mantém nome, descrição, escopos e expiração. Use quando suspeitar que o valor atual vazou: qualquer sistema ainda usando o segredo antigo passa a receber 401 na mesma hora.",
      requestExample: [
        `curl -X POST "$API_URL${base}/3d6f9e2a-.../rotate" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "id": "3d6f9e2a-...", "keyPrefix": "tfk_live_ef56gh78", "plainKey": "tfk_live_ef56gh78...", "...": "..." }',
      errorCodes: ["API_KEY_NOT_FOUND"],
    },
    {
      method: "DELETE",
      path: `${base}/:apiKeyId`,
      summary: "Revogar",
      description:
        "Definitivo — não existe reativar, só criar outra chave. Idempotente: revogar de novo é um no-op. Qualquer chamada feita com essa chave passa a receber 401 imediatamente; o registro continua aparecendo em `GET .../api-keys` (agora com `revokedAt` preenchido), só deixa de autenticar.",
      requestExample: [
        `curl -X DELETE "$API_URL${base}/3d6f9e2a-..." \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "revoked": true }',
      errorCodes: ["API_KEY_NOT_FOUND"],
    },
  ];
}

export function buildWebhookEndpoints(workspaceId: string): ApiEndpoint[] {
  const base = `/workspaces/${workspaceId}/webhook-endpoints`;
  return [
    {
      method: "POST",
      path: base,
      summary: "Criar um endpoint",
      description:
        "Cadastra um endpoint HTTPS do workspace que passa a receber um POST assinado a cada evento da lista escolhida. A URL é validada contra SSRF (rejeitada se resolver para IP privado, loopback, link-local ou metadados de nuvem) antes do endpoint ser salvo — nem em desenvolvimento existe exceção para `http://localhost`.",
      bodyParams: [
        { name: "url", type: "string", required: true, notes: "precisa começar com https://" },
        { name: "description", type: "string", required: false, notes: "até 500 caracteres" },
        { name: "events", type: "string[]", required: true, notes: "1 ou mais, da whitelist abaixo" },
      ],
      requestExample: [
        `curl -X POST "$API_URL${base}" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{",
        '    "url": "https://example.com/webhooks/taskflow",',
        '    "events": ["tasks.task_status_changed", "workspaces.member_added"]',
        "  }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: [
        "{",
        '  "id": "7b1a4c9d-...",',
        `  "workspaceId": "${workspaceId}",`,
        '  "url": "https://example.com/webhooks/taskflow",',
        '  "description": null,',
        '  "events": ["tasks.task_status_changed", "workspaces.member_added"],',
        '  "active": true,',
        '  "consecutiveFailureCount": 0,',
        '  "createdBy": "9c2e1b7a-...",',
        '  "createdAt": "2026-09-22T12:00:00.000Z",',
        '  "updatedAt": "2026-09-22T12:00:00.000Z",',
        '  "plainSigningSecret": "whsec_ab12cd34ef56gh78ij90kl12mn34op56"',
        "}",
      ].join("\n"),
      notes: [
        "`http://localhost` não funciona por causa da checagem de SSRF, nem em desenvolvimento — use um túnel (ex.: ngrok) para testar localmente.",
        "`plainSigningSecret` só aparece nesta resposta e na de rotação de segredo — copie agora, ele nunca mais é devolvido.",
      ],
      errorCodes: ["WEBHOOK_ENDPOINT_URL_NOT_ALLOWED", "INVALID_WEBHOOK_EVENT", "FORBIDDEN_WORKSPACE_ACTION"],
    },
    {
      method: "GET",
      path: `${base}?page=1&limit=20`,
      summary: "Listar endpoints",
      description:
        "Paginado. Não é cacheado — `active`/`consecutiveFailureCount` mudam sozinhos em segundo plano conforme as entregas acontecem.",
      queryParams: [
        { name: "page", type: "number", required: false, notes: "padrão 1" },
        { name: "limit", type: "number", required: false, notes: "padrão 20, máx. 100" },
      ],
      requestExample: [
        `curl "$API_URL${base}?page=1&limit=20" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: [
        "{",
        '  "data": [ { "id": "...", "url": "https://example.com/webhooks/taskflow", "active": true, "...": "..." } ],',
        '  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }',
        "}",
      ].join("\n"),
      errorCodes: ["FORBIDDEN_WORKSPACE_ACTION"],
    },
    {
      method: "PATCH",
      path: `${base}/:webhookEndpointId`,
      summary: "Editar um endpoint",
      description:
        "Atualiza URL, descrição, lista de eventos assinados e/ou o estado ativo/pausado do endpoint. Nenhum campo é obrigatório — envie só o que quer mudar.",
      bodyParams: [
        { name: "url", type: "string", required: false, notes: "reexecuta a checagem de SSRF" },
        { name: "description", type: "string", required: false },
        { name: "events", type: "string[]", required: false, notes: "substitui o array inteiro" },
        {
          name: "active",
          type: "boolean",
          required: false,
          notes: "true zera o contador de falhas consecutivas",
        },
      ],
      requestExample: [
        `curl -X PATCH "$API_URL${base}/7b1a4c9d-..." \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"active\": true }'",
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "id": "7b1a4c9d-...", "active": true, "consecutiveFailureCount": 0, "...": "..." }',
      notes: [
        "`active: true` é como se reverte um desligamento automático (kill switch) — sempre depois de corrigir o problema do seu lado.",
      ],
      errorCodes: ["WEBHOOK_ENDPOINT_NOT_FOUND", "WEBHOOK_ENDPOINT_URL_NOT_ALLOWED", "INVALID_WEBHOOK_EVENT"],
    },
    {
      method: "DELETE",
      path: `${base}/:webhookEndpointId`,
      summary: "Remover",
      description:
        "Apaga também o histórico de entregas (cascade). Irreversível — para voltar a receber os mesmos eventos é preciso cadastrar um endpoint novo, com um segredo novo.",
      requestExample: [
        `curl -X DELETE "$API_URL${base}/7b1a4c9d-..." \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "deleted": true }',
      errorCodes: ["WEBHOOK_ENDPOINT_NOT_FOUND"],
    },
    {
      method: "POST",
      path: `${base}/:webhookEndpointId/rotate-secret`,
      summary: "Girar segredo",
      description:
        "Sem corpo. Gera um segredo novo e invalida o antigo imediatamente, sem período de transição. Use quando suspeitar que o `plainSigningSecret` atual vazou — a partir desta chamada, verificar a assinatura de uma entrega com o segredo antigo falha.",
      requestExample: [
        `curl -X POST "$API_URL${base}/7b1a4c9d-.../rotate-secret" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "id": "7b1a4c9d-...", "plainSigningSecret": "whsec_novo...", "...": "..." }',
      errorCodes: ["WEBHOOK_ENDPOINT_NOT_FOUND"],
    },
    {
      method: "POST",
      path: `${base}/:webhookEndpointId/ping`,
      summary: "Testar (ping)",
      description:
        "Sem corpo. Dispara um evento sintético (`developer.webhook_ping`) pelo mesmo caminho de uma entrega real — mesma assinatura, mesma checagem de SSRF, mesmo retry.",
      requestExample: [
        `curl -X POST "$API_URL${base}/7b1a4c9d-.../ping" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: '{ "id": "f4e2a1b0-...", "eventName": "developer.webhook_ping", "status": "PENDING", "...": "..." }',
      notes: ["Consulte `GET .../deliveries/:deliveryId` logo depois para ver o resultado."],
      errorCodes: ["WEBHOOK_ENDPOINT_NOT_FOUND"],
    },
  ];
}

export function buildDeliveryEndpoints(workspaceId: string): ApiEndpoint[] {
  const base = `/workspaces/${workspaceId}/webhook-endpoints/:webhookEndpointId/deliveries`;
  return [
    {
      method: "GET",
      path: `${base}?page=1&limit=20`,
      summary: "Listar entregas",
      description:
        "Paginado. Entregas do endpoint, mais recentes primeiro — inclui tentativas em andamento (`PENDING`), bem-sucedidas (`SUCCEEDED`) e esgotadas (`FAILED`). Útil para um painel de debug sem precisar abrir cada entrega individualmente.",
      requestExample: [
        `curl "$API_URL${base}?page=1&limit=20" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: [
        "{",
        '  "data": [ { "id": "...", "eventName": "tasks.task_status_changed", "status": "SUCCEEDED", "...": "..." } ],',
        '  "meta": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }',
        "}",
      ].join("\n"),
      errorCodes: ["WEBHOOK_ENDPOINT_NOT_FOUND"],
    },
    {
      method: "GET",
      path: `${base}/:deliveryId`,
      summary: "Ver uma entrega",
      description:
        "Detalhe de uma tentativa de entrega específica: o payload não assinado enviado, quantas vezes já foi tentada e o resultado (status HTTP e erro) da última tentativa — o que dá pra investigar antes de decidir reenviar.",
      requestExample: [
        `curl "$API_URL${base}/f4e2a1b0-..." \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: [
        "{",
        '  "id": "f4e2a1b0-...",',
        '  "webhookEndpointId": "7b1a4c9d-...",',
        '  "eventName": "tasks.task_status_changed",',
        '  "status": "FAILED",',
        '  "attemptCount": 5,',
        '  "lastAttemptAt": "2026-09-22T12:05:00.000Z",',
        '  "lastResponseStatus": 503,',
        '  "lastError": "Unexpected response status 503",',
        '  "payload": { "entityId": "...", "actorId": "...", "fromStatus": "TODO", "toStatus": "DONE" },',
        '  "createdAt": "2026-09-22T12:00:00.000Z"',
        "}",
      ].join("\n"),
      notes: [
        "`status`: `PENDING` (ainda tentando) → `SUCCEEDED` (2xx) ou `FAILED` (esgotou tentativas, endpoint desativado, ou URL bloqueada por SSRF).",
        "`payload` é o corpo **não assinado** — a assinatura é recomputada a cada tentativa.",
      ],
      errorCodes: ["WEBHOOK_ENDPOINT_NOT_FOUND", "WEBHOOK_DELIVERY_NOT_FOUND"],
    },
    {
      method: "POST",
      path: `${base}/:deliveryId/redeliver`,
      summary: "Reenviar",
      description:
        "Sem corpo. Cria uma entrega nova com o mesmo evento e payload — a original nunca é reaberta, o histórico de tentativas fica intacto.",
      requestExample: [
        `curl -X POST "$API_URL${base}/f4e2a1b0-.../redeliver" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: '{ "id": "a91c3d2e-...", "eventName": "tasks.task_status_changed", "status": "PENDING", "...": "..." }',
      errorCodes: ["WEBHOOK_ENDPOINT_NOT_FOUND", "WEBHOOK_DELIVERY_NOT_FOUND"],
    },
  ];
}

export const API_KEY_SCOPE_ROWS = API_KEY_SCOPES.map((scope) => ({
  scope,
  label: API_KEY_SCOPE_LABEL[scope],
}));

export const WEBHOOK_EVENT_ROWS = WEBHOOK_EVENT_GROUPS.map((group) => ({
  label: group.label,
  events: group.events.map((event) => ({ event, label: WEBHOOK_EVENT_LABEL[event] })),
}));

export const SIGNATURE_VERIFICATION_CODE = `const crypto = require("crypto");

function isValidSignature(rawBody, signatureHeader, signingSecret) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", signingSecret)
    .update(rawBody) // Buffer/string do corpo cru, antes do JSON.parse
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader)
  );
}`;

export const DELIVERY_PAYLOAD_EXAMPLE = `POST /webhooks/taskflow HTTP/1.1
Content-Type: application/json
X-TaskFlow-Signature: sha256=<hmac em hex>

{
  "id": "f4e2a1b0-...",
  "event": "tasks.task_status_changed",
  "createdAt": "2026-09-22T12:00:00.000Z",
  "data": { "entityId": "...", "actorId": "...", "fromStatus": "TODO", "toStatus": "DONE" }
}`;

export const ERROR_ENVELOPE_EXAMPLE = `{
  "statusCode": 404,
  "code": "API_KEY_NOT_FOUND",
  "message": "Api key not found",
  "timestamp": "2026-09-22T12:00:00.000Z"
}`;

export const VALIDATION_ERROR_EXAMPLE = `{
  "statusCode": 400,
  "message": ["scopes should not be empty"],
  "error": "Bad Request"
}`;
