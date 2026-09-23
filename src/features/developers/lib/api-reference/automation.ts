import type { ApiEndpoint } from "@/features/developers/lib/api-reference-data";

// API.md § 20-21 (Tempo Real + Automações).
export function buildAutomationEndpoints(workspaceId: string): ApiEndpoint[] {
  const base = `/workspaces/${workspaceId}/automation-rules`;
  return [
    {
      method: "POST",
      path: `/workspaces/${workspaceId}/realtime/ticket`,
      summary: "Emitir um ticket de conexão SSE",
      description:
        "Sem corpo. O ticket é de uso único, vale 30s, e só serve para este `workspaceId`. Nunca coloque o `accessToken` na URL do `EventSource` — é para isso que o ticket existe.",
      requestExample: [
        `curl -X POST "$API_URL/workspaces/${workspaceId}/realtime/ticket" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "ticket": "...", "expiresInSeconds": 30 }',
      errorCodes: ["FORBIDDEN_WORKSPACE_ACTION"],
    },
    {
      method: "GET",
      path: "/realtime/stream?ticket=...",
      summary: "Conectar ao canal SSE",
      description:
        "Autenticado pelo ticket (sem header `Authorization`). Só entrega sinais de invalidação (\"algo mudou\"), nunca dado de entidade — o dado real sempre vem dos endpoints normais e de `GET /sync/pull`. Primeiro frame é sempre `{ \"type\": \"sync\" }`.",
      requestExample: ['const es = new EventSource(`${API_URL}/realtime/stream?ticket=${ticket}`);'].join("\n"),
      responseStatus: "200 OK (text/event-stream)",
      responseExample: [
        "data: {\"type\":\"sync\"}",
        "",
        'data: {"type":"change","entityType":"TASK","entityId":"...","eventType":"tasks.task_status_changed","workspaceId":"...","occurredAt":"..."}',
      ].join("\n"),
      notes: [
        "Ticket já usado/expirado (401 `REALTIME_TICKET_INVALID`) faz o auto-reconnect nativo do `EventSource` falhar — peça um ticket novo e reabra a conexão no `onerror`.",
        "Nem toda mudança gera `change`: hoje não avisam criar/excluir task, nem editar/excluir section ou excluir comentário.",
      ],
    },
    {
      method: "POST",
      path: base,
      summary: "Criar uma regra de automação",
      description: "\"Quando X acontecer, executa Y\" sem confirmação humana. Requer `OWNER`/`ADMIN`. `action.tool` só aceita as tools de task do assistente (nunca `read`/`critical`).",
      bodyParams: [
        { name: "name", type: "string", required: true, notes: "1 a 120 caracteres" },
        { name: "trigger", type: "{ entityType, eventType, conditions? }", required: true },
        { name: "action", type: "{ tool, params }", required: true },
      ],
      requestExample: [
        `curl -X POST "$API_URL${base}" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{",
        '    "name": "Concluída -> mover para Done",',
        '    "trigger": { "entityType": "TASK", "eventType": "tasks.task_status_changed", "conditions": [{ "field": "toStatus", "operator": "equals", "value": "DONE" }] },',
        '    "action": { "tool": "move_task", "params": { "taskId": "{{payload.entityId}}", "sectionId": "SECTION_ID" } }',
        "  }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: '{ "id": "uuid", "name": "Concluída -> mover para Done", "enabled": true, "createdBy": "uuid", "trigger": { "...": "..." }, "action": { "...": "..." } }',
      errorCodes: ["INVALID_AUTOMATION_TRIGGER", "INVALID_AUTOMATION_ACTION"],
    },
    {
      method: "GET",
      path: base,
      summary: "Listar regras",
      description: "Paginado. Não cacheado — `enabled` pode mudar sozinho (kill switch).",
      requestExample: [`curl "$API_URL${base}" \\`, '  -H "Authorization: Bearer $ACCESS_TOKEN"'].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "data": [ { "id": "...", "enabled": true, "...": "..." } ], "meta": { "...": "..." } }',
      errorCodes: ["FORBIDDEN_WORKSPACE_ACTION"],
    },
    {
      method: "PATCH",
      path: `${base}/:ruleId`,
      summary: "Editar uma regra",
      description: "`trigger`/`action` substituem o objeto inteiro e são revalidados juntos. `enabled: true` é o único jeito de religar uma regra que o kill switch desligou.",
      bodyParams: [
        { name: "name", type: "string", required: false },
        { name: "trigger", type: "object", required: false },
        { name: "action", type: "object", required: false },
        { name: "enabled", type: "boolean", required: false },
      ],
      requestExample: [
        `curl -X PATCH "$API_URL${base}/RULE_ID" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{ \"enabled\": true }'",
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "id": "RULE_ID", "enabled": true, "...": "..." }',
      errorCodes: ["INVALID_AUTOMATION_TRIGGER", "INVALID_AUTOMATION_ACTION", "AUTOMATION_RULE_NOT_FOUND"],
    },
    {
      method: "DELETE",
      path: `${base}/:ruleId`,
      summary: "Remover uma regra",
      requestExample: [`curl -X DELETE "$API_URL${base}/RULE_ID" \\`, '  -H "Authorization: Bearer $ACCESS_TOKEN"'].join(
        "\n",
      ),
      responseStatus: "200 OK",
      responseExample: '{ "deleted": true }',
      errorCodes: ["AUTOMATION_RULE_NOT_FOUND"],
    },
  ];
}
