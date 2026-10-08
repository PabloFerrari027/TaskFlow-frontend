---
name: taskflow-web-assistant
description: Acompanha no TaskFlow-frontend as ações (tools) do assistente de IA do backend — rótulo no resumo da sessão (TOOL_PAST_LABEL), atualização de cache depois de confirmar (applyConfirmedActionEffects) ou de executar direto (executedActions), cartão de confirmação que sempre mostra humanDescription e params, reautenticação de ação crítica e avisos de cota/limite de IA; inclui um script que compara as tools do backend com o front. Use sempre que o pedido for "ação nova do assistente", "o assistente ganhou a tool X", "confirmar ação do assistente", "cartão de confirmação", "PendingAction", "reautenticação", "o assistente fez X e a tela não atualizou", "resumo da conversa do assistente", "cota de IA no chat", "TOKEN_QUOTA_EXCEEDED", ou "mostrar o diff da ação".
---

# Assistente de IA no front

Código: `src/features/assistant/` — `hooks/use-assistant.ts` (`applyConfirmedActionEffects`,
`useConfirmPendingActionMutation`), `components/pending-action-card.tsx`,
`pending-action-details.tsx`, `reauth-dialog.tsx`, `assistant-session-summary.tsx`,
`assistant-message.tsx` (ações executadas e rótulos de "rodando"), `lib/tool-labels.ts` (`TOOL_PAST_LABEL`),
`lib/describe-params.ts` + `hooks/use-entity-name-lookup.ts` (params legíveis), `types.ts`. Contrato: `API.md` §16 do backend. Lado do
servidor: skill `taskflow-assistant-action` no backend (catálogos em
`backend/src/modules/actions/application/catalogs/`).

## Regra de segurança que não muda

O cartão de confirmação **sempre** mostra `humanDescription` **e** `params` — nunca só o `reply` do
modelo. É a mitigação de prompt injection que o `API.md` §16 ("Risco residual") deixa a cargo do
front, e o comentário em `types.ts` repete. Pode deixar os `params` mais legíveis; não pode escondê-los.

## Passos — tool nova (ou que o front ainda não conhece)

1. **Compare com o backend:**
   ```bash
   node .claude/skills/taskflow-web-assistant/scripts/check-assistant-tools.mjs
   ```
   (backend em `~/Projects/TaskFlow-backend`; `--backend <path>` para outro). Lista tools de escrita
   sem rótulo e sem `case` de cache, e nomes que o front cita mas o backend não tem mais.

2. **Rótulo no passado** em `TOOL_PAST_LABEL` (`features/assistant/lib/tool-labels.ts`): pt-BR leigo
   ("Pasta arquivada", "Item movido"), usado no "✅" da mensagem e no resumo da sessão. Tools de
   leitura também levam rótulo (aparecem como executadas). Sem entrada, aparece "Ação concluída".
   Tool que roda na hora (leitura ou `capture` sem confirmação) também ganha texto de "rodando" em
   `READ_TOOL_LABEL` (`assistant-message.tsx`); as demais mostram "Preparando a ação para você confirmar...".

3. **Efeito no cache** em `applyConfirmedActionEffects` (`use-assistant.ts`): um `case "<tool>"`
   explícito — o comentário da função proíbe o "invalida tudo". O `result` tem o mesmo formato da
   resposta REST do use case equivalente: use `setQueryData` no detalhe quando ele vier inteiro e
   invalide as listas, como o hook REST da feature faz (copie a invalidação de lá, inclusive dados
   derivados como `folderStats`/`home`).

4. **Tools que rodam sem confirmação** (catálogo `capture`: `save_information`,
   `relocate_information`, `undo_saved_information`...) chegam em `executedActions` da resposta do
   chat, não passam pelo confirm. O `onSuccess` de `useSendChatMessageMutation` aplica o mesmo
   `applyConfirmedActionEffects` a cada uma (leituras caem no `default`) — basta o `case` do passo 3.
   Os resultados de `capture` só trazem rótulos de lugar (sem `folderId`), por isso usam a invalidação
   ampla de `invalidateCapturedPlaces`.

5. **Params e `diff` legíveis** (`PendingActionDetails`): param novo com nome que o front não
   conhece → rótulo em `FIELD_LABEL` (`lib/describe-params.ts`); param que é id → `ID_FIELD_KIND` (o
   nome vem do cache via `useEntityNameLookup`, senão o id abreviado); enum → mapa de rótulo
   (`ITEM_STATUS_LABEL`, `ITEM_PRIORITY_LABEL`, `WORKSPACE_ROLE_LABEL`, `CAPTURE_TYPE_LABEL`). O `diff`
   (`[{ field, from, to }]`, só em tools de update) usa o mesmo formatador e aparece como "de → para".
   Nunca remova um param da lista para "limpar" a tela.

6. **`critical`**: abre `ReauthDialog` (senha; "Confirmar com Google" só com
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID`). `twoFactorCode` é rejeitado pela API — não ofereça.
   `revoke_session` com `isCurrentSession` mostra o aviso "Isso vai desconectar você agora."

7. **Erros de IA**: `TOKEN_QUOTA_EXCEEDED` → aviso de limite do plano com link para `/settings/plan`,
   sem afirmar qual janela (dia/semana/mês) estourou; `AI_RATE_LIMIT_EXCEEDED`/
   `AI_ASSISTANT_RATE_LIMIT_EXCEEDED` → texto de "muitas perguntas em pouco tempo". Mensagens em
   `src/lib/errors.ts`; codes novos pela skill `taskflow-web-api-contract`.

8. **Teste no navegador** com a API local e o assistente ligado no workspace (`/assistant`, só OWNER
   liga): peça a ação, confira o cartão (descrição + params), confirme, veja a tela atualizar sem F5
   e o resumo em "Encerrar e revisar".

## Checklist final

- [ ] Script sem tool de escrita faltando
- [ ] `TOOL_PAST_LABEL` (`lib/tool-labels.ts`) com rótulo leigo para cada tool nova; texto de "rodando" se ela roda na hora
- [ ] `case` explícito em `applyConfirmedActionEffects` (mesma invalidação do hook REST)
- [ ] Tools sem confirmação também atualizam o cache via `executedActions`
- [ ] Cartão continua mostrando `humanDescription` + TODOS os `params`, legíveis (rótulo de campo, enum, id → nome)
- [ ] `critical` passa por reautenticação; aviso de sessão atual em `revoke_session`
- [ ] Mensagens de cota/limite corretas, com link para `/settings/plan`
- [ ] Testado ponta a ponta no navegador
