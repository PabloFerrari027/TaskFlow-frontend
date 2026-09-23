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
        "Toda tool de escrita (`standard`/`critical`) sempre vira uma `PendingAction` — o assistente nunca executa uma mudança diretamente. Aceita `application/json` (sem anexos) ou `multipart/form-data` (com `files`, `history` como string JSON).",
      bodyParams: [
        { name: "message", type: "string", required: false, notes: "opcional só no multipart com áudio anexado" },
        { name: "workspaceId", type: "string", required: true },
        { name: "history", type: "{ role, content }[]", required: false, notes: "até 50 mensagens" },
        { name: "files", type: "File[]", required: false, notes: "só multipart, até 6 arquivos" },
      ],
      requestExample: [
        'curl -X POST "$API_URL/assistant/chat" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{",
        `    "message": "Crie uma task \\"Revisar contrato\\" no projeto Jurídico", "workspaceId": "${workspaceId}"`,
        "  }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: [
        "{",
        '  "reply": "Vou precisar da sua confirmação para criar essa task.",',
        '  "executedActions": [],',
        '  "pendingActions": [{ "id": "uuid", "tool": "create_task", "riskLevel": "standard", "humanDescription": "Criar a task \\"Revisar contrato\\" neste projeto.", "params": { "...": "..." } }],',
        '  "transcriptions": []',
        "}",
      ].join("\n"),
      notes: [
        "`humanDescription` é sempre um template determinístico do backend, nunca texto do modelo — mostre-o (com `params`) na UI, nunca só o `reply`.",
        "Uma tool de update inclui `diff` (`{ field, from, to }[]`) — `from` sempre vem de uma leitura real do backend, nunca do que o modelo \"disse\".",
      ],
      errorCodes: ["ASSISTANT_DISABLED_FOR_WORKSPACE", "AI_ASSISTANT_RATE_LIMIT_EXCEEDED", "TOKEN_QUOTA_EXCEEDED", "AI_ASSISTANT_TRANSLATION_FAILED", "ASSISTANT_ATTACHMENT_TOO_LARGE", "ASSISTANT_TOO_MANY_ATTACHMENTS", "ASSISTANT_AUDIO_TOO_LONG", "ASSISTANT_TRANSCRIPTION_FAILED", "ASSISTANT_EMPTY_TRANSCRIPTION"],
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
      responseExample: '{ "tool": "create_task", "result": { "...": "TaskDto" } }',
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
  ];
}
