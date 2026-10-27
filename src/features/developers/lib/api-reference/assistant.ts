import type { ApiEndpoint } from "@/features/developers/lib/api-reference-data";

// API.md § 16 (Assistente de IA com ações). Desligado por padrão em todo
// workspace — ver PATCH .../assistant-settings na seção de Workspaces.
export function buildAssistantEndpoints(workspaceId: string): ApiEndpoint[] {
  return [
    {
      method: "POST",
      path: "/assistant/chat",
      summary: "Conversar com o assistente",
      description:
        "Toda tool de escrita (`standard`/`critical`) sempre vira uma `PendingAction` — o assistente nunca executa uma mudança diretamente. Aceita `application/json` (sem anexos) ou `multipart/form-data` (com `files`). Cada pessoa tem um chat só: o servidor lê o contexto das últimas mensagens gravadas — não mande `history`.",
      bodyParams: [
        { name: "message", type: "string", required: false, notes: "opcional só no multipart com áudio anexado" },
        { name: "workspaceId", type: "string", required: true },
        { name: "start", type: "boolean", required: false, notes: "abre um chat vazio: sem message/files, o assistente escreve a primeira mensagem" },
        { name: "files", type: "File[]", required: false, notes: "só multipart, até 6 arquivos" },
      ],
      requestExample: [
        'curl -X POST "$API_URL/assistant/chat" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{",
        `    "message": "Crie um item \\"Revisar contrato\\" na pasta Jurídica", "workspaceId": "${workspaceId}"`,
        "  }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: [
        "{",
        '  "reply": "Vou precisar da sua confirmação para criar esse item.",',
        '  "executedActions": [],',
        '  "pendingActions": [{ "id": "uuid", "tool": "create_item", "riskLevel": "standard", "humanDescription": "Criar o item \\"Revisar contrato\\" nesta pasta.", "params": { "...": "..." } }],',
        '  "transcriptions": []',
        "}",
      ].join("\n"),
      notes: [
        "`humanDescription` é sempre um template determinístico do backend, nunca texto do modelo — mostre-o (com `params`) na UI, nunca só o `reply`.",
        "Uma tool de update inclui `diff` (`{ field, from, to }[]`) — `from` sempre vem de uma leitura real do backend, nunca do que o modelo \"disse\".",
      ],
      errorCodes: ["ASSISTANT_DISABLED_FOR_WORKSPACE", "ASSISTANT_CONVERSATION_NOT_EMPTY", "AI_ASSISTANT_RATE_LIMIT_EXCEEDED", "TOKEN_QUOTA_EXCEEDED", "AI_ASSISTANT_TRANSLATION_FAILED", "ASSISTANT_ATTACHMENT_TOO_LARGE", "ASSISTANT_TOO_MANY_ATTACHMENTS", "ASSISTANT_AUDIO_TOO_LONG", "ASSISTANT_TRANSCRIPTION_FAILED", "ASSISTANT_EMPTY_TRANSCRIPTION"],
    },
    {
      method: "POST",
      path: "/assistant/chat/stream",
      summary: "Conversar com o assistente (streaming)",
      description:
        "Mesmo corpo, limites e erros de admissão de `POST /assistant/chat`, mas a resposta é SSE (`text/event-stream`): cada frame é `data: <json>` com um `type` — `status` (`stage`, `tool?`), `transcription`, `text_delta` (`delta`), `pending_action` (`action`), `warning` (`message`) e, por último, `done` (`result`, idêntico ao corpo de `POST /assistant/chat`) ou `error` (`statusCode`, `code`, `message`). `EventSource` não faz POST: leia com `fetch` + `response.body.getReader()`.",
      bodyParams: [
        { name: "message", type: "string", required: false, notes: "opcional só no multipart com áudio anexado" },
        { name: "workspaceId", type: "string", required: true },
        { name: "start", type: "boolean", required: false, notes: "abre um chat vazio: sem message/files, o assistente escreve a primeira mensagem" },
        { name: "files", type: "File[]", required: false, notes: "só multipart, até 6 arquivos" },
      ],
      requestExample: [
        'curl -N -X POST "$API_URL/assistant/chat/stream" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{",
        `    "message": "Crie um item \\"Revisar contrato\\" na pasta Jurídica", "workspaceId": "${workspaceId}"`,
        "  }'",
      ].join("\n"),
      responseStatus: "200 OK (text/event-stream)",
      responseExample: [
        'data: {"type":"status","stage":"loading_context"}',
        'data: {"type":"status","stage":"thinking"}',
        'data: {"type":"status","stage":"running_tool","tool":"create_item"}',
        'data: {"type":"pending_action","action":{"id":"uuid","tool":"create_item","riskLevel":"standard","humanDescription":"Criar o item \\"Revisar contrato\\" nesta pasta.","params":{"...":"..."}}}',
        'data: {"type":"text_delta","delta":"Vou precisar da sua "}',
        'data: {"type":"text_delta","delta":"confirmação para criar esse item."}',
        'data: {"type":"done","result":{"reply":"Vou precisar da sua confirmação para criar esse item.","executedActions":[],"pendingActions":[...],"transcriptions":[]}}',
      ].join("\n"),
      notes: [
        "Recusas de admissão (assistente desligado, rate limit, cota, anexos, 400) continuam sendo erros HTTP normais, antes de qualquer frame.",
        "`done.result.reply` é a versão final e autoritativa: substitua por ela o texto acumulado dos `text_delta`.",
        "Linhas começando com `:` (`:ping`, a cada 15s) são keep-alive — ignore.",
        "Fechar a conexão aborta a chamada ao modelo; uma `PendingAction` já registrada continua válida até o TTL.",
      ],
      errorCodes: ["ASSISTANT_DISABLED_FOR_WORKSPACE", "ASSISTANT_CONVERSATION_NOT_EMPTY", "AI_ASSISTANT_RATE_LIMIT_EXCEEDED", "TOKEN_QUOTA_EXCEEDED", "AI_ASSISTANT_TRANSLATION_FAILED", "AI_INSUFFICIENT_CREDITS", "REQUEST_TIMEOUT", "ASSISTANT_ATTACHMENT_TOO_LARGE", "ASSISTANT_TOO_MANY_ATTACHMENTS", "ASSISTANT_AUDIO_TOO_LONG", "ASSISTANT_TRANSCRIPTION_FAILED", "ASSISTANT_EMPTY_TRANSCRIPTION"],
    },
    {
      method: "POST",
      path: "/assistant/actions/:actionId/confirm",
      summary: "Confirmar uma ação pendente",
      description:
        "Revalida tudo de novo (papel/permissão pode ter mudado) e chama o mesmo Use Case real do recurso. Ação `critical` exige `reauth` (senha ou Google ID Token); `standard` só precisa de `{}`.",
      bodyParams: [
        { name: "reauth", type: "{ password?: string } | { googleIdToken?: string }", required: false, notes: "obrigatório para riskLevel: critical" },
      ],
      requestExample: [
        'curl -X POST "$API_URL/assistant/actions/ACTION_ID/confirm" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{}'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: '{ "tool": "create_item", "result": { "...": "ItemDto" } }',
      errorCodes: ["PENDING_ACTION_NOT_FOUND", "PENDING_ACTION_EXPIRED", "REAUTHENTICATION_REQUIRED"],
    },
    {
      method: "POST",
      path: "/assistant/actions/:actionId/cancel",
      summary: "Cancelar uma ação pendente",
      requestExample: [
        'curl -X POST "$API_URL/assistant/actions/ACTION_ID/cancel" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: '{ "cancelled": true }',
      errorCodes: ["PENDING_ACTION_NOT_FOUND", "PENDING_ACTION_EXPIRED"],
    },
    {
      method: "GET",
      path: "/assistant/conversation/messages",
      summary: "Ler o seu chat com o assistente",
      description:
        "Um chat por pessoa, com todo o histórico (de todos os workspaces). A primeira página traz as mensagens mais recentes, cada página em ordem cronológica; `nextCursor` busca as anteriores.",
      queryParams: [
        { name: "cursor", type: "string", required: false, notes: "nextCursor da página anterior" },
        { name: "limit", type: "number", required: false, notes: "padrão 50, máx. 200" },
      ],
      responseStatus: "200 OK",
      responseExample: '{ "items": [{ "id": "uuid", "role": "assistant", "workspaceId": "uuid", "content": "Oi! O que você faz no dia a dia?", "metadata": null, "createdAt": "..." }], "nextCursor": null }',
    },
    {
      method: "DELETE",
      path: "/assistant/conversation/messages",
      summary: "Limpar o chat",
      description: "Apaga todas as mensagens. O que o assistente sabe sobre você (`/assistant/profile`) continua.",
      responseStatus: "204 No Content",
      responseExample: "",
    },
    {
      method: "GET",
      path: "/assistant/profile",
      summary: "O que o assistente sabe sobre você",
      description: "Resumo escrito pelo assistente com o que você contou (vai ao prompt de toda conversa) e o andamento do onboarding.",
      responseStatus: "200 OK",
      responseExample: '{ "summary": "Tem uma confeitaria e quer organizar as encomendas.", "onboarding": "FINISHED", "updatedAt": "..." }',
    },
    {
      method: "PATCH",
      path: "/assistant/profile",
      summary: "Corrigir ou apagar o que o assistente sabe sobre você",
      bodyParams: [{ name: "summary", type: "string | null", required: true, notes: "substitui inteiro, até 2000 caracteres; null apaga" }],
      responseStatus: "200 OK",
      responseExample: '{ "summary": null, "onboarding": "FINISHED", "updatedAt": "..." }',
    },
  ];
}
