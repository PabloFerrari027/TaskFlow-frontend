import type { ApiEndpoint } from "@/features/developers/lib/api-reference-data";

// API.md § 12-14 (Analytics + Sync + Activity Log).
export function buildDataEndpoints(workspaceId: string): ApiEndpoint[] {
  return [
    {
      method: "POST",
      path: "/analytics/query",
      summary: "Query estruturada de analytics",
      description:
        "Engine whitelisted para alimentar gráficos sem expor SQL arbitrário. `workspaceId` é sempre revalidado contra o token — nunca confie só em enviá-lo no body. `folderId` em filtros/`groupBy` soma a subárvore de subpastas inteira.",
      bodyParams: [
        { name: "entity", type: '"items" | "folders"', required: true },
        { name: "workspaceId", type: "string", required: true },
        { name: "filters", type: "AnalyticsFilter[]", required: false, notes: "campo/operador/valor da whitelist" },
        { name: "groupBy", type: "string[]", required: false },
        { name: "sort", type: "{ field, direction }[]", required: false, notes: "field precisa também estar em groupBy" },
        { name: "metrics", type: '{ type: "count"|"sum"|"average"|"derived", field?, name? }[]', required: true, notes: "ao menos 1 item" },
      ],
      requestExample: [
        'curl -X POST "$API_URL/analytics/query" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{",
        `    "entity": "items", "workspaceId": "${workspaceId}",`,
        '    "filters": [{ "field": "status", "operator": "equals", "value": "DONE" }],',
        '    "groupBy": ["folderId"],',
        '    "metrics": [{ "type": "count", "field": "id" }]',
        "  }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: [
        "{",
        '  "entity": "items", "groupBy": ["folderId"],',
        '  "metrics": [{ "type": "count", "field": "id", "alias": "count" }],',
        '  "data": [ { "folderId": "uuid-a", "count": 12 }, { "folderId": "uuid-b", "count": 5 } ]',
        "}",
      ].join("\n"),
      notes: [
        "Métricas derivadas (`type: \"derived\"`) usam `name` em vez de `field`: `completion_rate`, `overdue_rate`, `average_completion_time`, `cycle_time` — só para `entity: \"items\"`.",
      ],
      errorCodes: ["INVALID_ANALYTICS_QUERY", "UNSUPPORTED_DERIVED_METRIC", "FORBIDDEN_WORKSPACE_ACTION"],
    },
    {
      method: "POST",
      path: "/analytics/query/natural-language",
      summary: "Traduzir pergunta em linguagem natural",
      description:
        "Traduz o texto para o mesmo `AnalyticsQueryDto` via IA e executa exatamente o mesmo pipeline de `POST /analytics/query` — mesma whitelist, mesma checagem de papel. `workspaceId` nunca vem do modelo, sempre do body revalidado contra o token.",
      bodyParams: [
        { name: "text", type: "string", required: true, notes: "1 a 500 caracteres" },
        { name: "workspaceId", type: "string", required: true },
      ],
      requestExample: [
        'curl -X POST "$API_URL/analytics/query/natural-language" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{",
        '    "text": "Mostre itens atrasados por pasta",',
        `    "workspaceId": "${workspaceId}"`,
        "  }'",
      ].join("\n"),
      responseStatus: "201 Created",
      responseExample: [
        "{",
        '  "query": { "entity": "items", "filters": [ "..." ], "groupBy": ["folderId"], "metrics": [ "..." ] },',
        '  "result": { "entity": "items", "groupBy": ["folderId"], "metrics": [ "..." ], "data": [ { "folderId": "uuid-a", "count": 3 } ] }',
        "}",
      ].join("\n"),
      notes: ["`query` devolve a interpretação da IA, para o front mostrar \"entendi sua pergunta como...\" antes do gráfico."],
      errorCodes: ["AI_RATE_LIMIT_EXCEEDED", "TOKEN_QUOTA_EXCEEDED", "AI_TRANSLATION_FAILED", "INVALID_ANALYTICS_QUERY", "FORBIDDEN_WORKSPACE_ACTION"],
    },
    {
      method: "POST",
      path: "/sync/push",
      summary: "Enviar lote de operações offline",
      description:
        "Idempotente por `operationId`. Até 100 operações por chamada — acima disso a chamada inteira é rejeitada antes de aplicar qualquer item. Pense nisso como suporte a um app mobile/PWA offline-first; um frontend web sempre-online pode ignorar esta seção e usar as rotas normais.",
      bodyParams: [
        { name: "workspaceId", type: "string", required: true },
        { name: "operations", type: "SyncOperation[]", required: true, notes: "máx. 100" },
      ],
      requestExample: [
        'curl -X POST "$API_URL/sync/push" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '{",
        `    "workspaceId": "${workspaceId}",`,
        '    "operations": [{ "operationId": "uuid-v4", "entityType": "ITEM", "entityId": "uuid", "operationType": "UPDATE", "payload": { "status": "DONE" }, "baseVersion": 3 }]',
        "  }'",
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "results": [ { "operationId": "uuid-v4", "status": "APPLIED", "serverEntityState": { "...": "ItemDto" } } ] }',
      notes: [
        "`status` por operação: `APPLIED | CONFLICT | REJECTED | DUPLICATE`. `FOLDER` e `CUSTOM_FIELD_DEFINITION` não aceitam `DELETE` (sempre `REJECTED`); `COMMENT` não aceita `UPDATE`.",
      ],
      errorCodes: ["SYNC_BATCH_TOO_LARGE", "SYNC_VERSION_CONFLICT"],
    },
    {
      method: "GET",
      path: "/sync/pull",
      summary: "Buscar mudanças desde um cursor",
      description: "Único endpoint de listagem que usa cursor (`since`/`nextCursor`) em vez de `page`/`limit`. Omitir `since` equivale a `since=0` (sincronização inicial completa).",
      queryParams: [
        { name: "workspaceId", type: "string", required: true },
        { name: "since", type: "string", required: false, notes: "cursor/syncVersion" },
        { name: "limit", type: "number", required: false },
      ],
      requestExample: [
        `curl "$API_URL/sync/pull?workspaceId=${workspaceId}&since=0&limit=100" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "changes": [ "..." ], "nextCursor": "1234", "hasMore": false }',
      notes: ["Pagine chamando de novo com `since=nextCursor` enquanto `hasMore === true`."],
    },
    {
      method: "GET",
      path: `/workspaces/${workspaceId}/activity`,
      summary: "Timeline do workspace",
      description: "Paginado, ordenado por `occurredAt` descendente. Cobre ITEM, COMMENT, SECTION, CUSTOM_FIELD, WORKSPACE, FOLDER, AUTOMATION_RULE, API_KEY, WEBHOOK_ENDPOINT.",
      requestExample: [
        `curl "$API_URL/workspaces/${workspaceId}/activity" \\`,
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: [
        "{",
        '  "data": [ { "id": "uuid", "entityType": "ITEM", "eventType": "items.item_status_changed", "payload": { "fromStatus": "TODO", "toStatus": "DONE" }, "actorId": "uuid", "occurredAt": "..." } ],',
        '  "meta": { "...": "..." }',
        "}",
      ].join("\n"),
      errorCodes: ["FORBIDDEN_WORKSPACE_ACTION"],
    },
    {
      method: "GET",
      path: "/folders/:folderId/activity",
      summary: "Timeline de uma pasta",
      description: "Paginado, ordenado por `occurredAt` descendente. Tudo gravado com este `folderId`: a própria pasta, seus items, comentários, seções e campos. Não inclui subpastas.",
      requestExample: [
        'curl "$API_URL/folders/FOLDER_ID/activity" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "data": [ { "id": "...", "folderId": "...", "entityType": "SECTION", "...": "..." } ], "meta": { "...": "..." } }',
      errorCodes: ["FOLDER_NOT_FOUND", "FORBIDDEN_WORKSPACE_ACTION"],
    },
    {
      method: "GET",
      path: "/items/:itemId/activity",
      summary: "Timeline de um item",
      description: "Paginado. Entradas ITEM deste item, unidas a comentários feitos nele (COMMENT). Nunca inclui SECTION/CUSTOM_FIELD/WORKSPACE/FOLDER.",
      requestExample: [
        'curl "$API_URL/items/ITEM_ID/activity" \\',
        '  -H "Authorization: Bearer $ACCESS_TOKEN"',
      ].join("\n"),
      responseStatus: "200 OK",
      responseExample: '{ "data": [ { "id": "...", "entityType": "ITEM", "...": "..." } ], "meta": { "...": "..." } }',
      errorCodes: ["ITEM_NOT_FOUND", "FORBIDDEN_WORKSPACE_ACTION"],
    },
  ];
}
