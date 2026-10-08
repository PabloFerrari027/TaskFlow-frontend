---
name: taskflow-web-offline
description: Faz uma edição funcionar offline no TaskFlow-frontend e mantém a tela atualizada em tempo real — desvio da mutation para a fila (queueEntityUpdate/queueEntityDelete do sync-engine) com a versão em cache, patch otimista na lista com rollback, toast de "salvo offline", mapeamento entityType → queryKeys em invalidate-entity.ts usado pelo pull e pelo SSE, e o que só funciona online. Use sempre que o pedido falar em "offline", "sem internet", "salvar sem conexão", "outbox", "fila de sincronização", "sync", "conflito de versão", "SYNC_VERSION_CONFLICT", "tempo real", "atualizar sozinho quando outro usuário muda", "SSE", "EventSource", "a lista não atualiza depois de editar", ou "entityType novo no realtime".
---

# Offline e tempo real

Motor: `src/features/sync/` (`lib/sync-engine.ts`, `lib/outbox.ts`, `lib/invalidate-entity.ts`,
`context/sync-context.tsx`). Tempo real: `src/features/realtime/`. Hook modelo:
`useUpdateFolderMutation` + `patchCachedFolder` em `src/features/folders/hooks/use-folders.ts`.
"Porquê" (inclusive por que criar offline não é suportado): `ARCHITECTURE.md` §10 e §8
("Atualização otimista em cache de lista"). Lado do servidor: skill `taskflow-sync-handler` no backend.

## O que pode ser offline

Só edição/exclusão de entidade que já existe e tem `version`: `ITEM`, `FOLDER`, `SECTION`,
`CUSTOM_FIELD_DEFINITION` (edição); `ITEM`, `SECTION`, `COMMENT` (exclusão). `FOLDER` e
`CUSTOM_FIELD_DEFINITION` recusam DELETE (arquivar, sim). Criar qualquer coisa e valor de custom
field ficam online-only. Entidade nova só entra depois que o backend tiver handler para ela
(`SyncEntityType` em `src/types/sync.ts` espelha o do backend).

## Passos — mutation que funciona offline

1. **Ache a cópia em cache com `version`** dentro do `mutationFn`: detalhe
   (`queryKeys.x.detail(id)`) e, se não houver, a lista que a tela usa.
2. **Desvie quando offline**:
   ```ts
   if (isOffline() && workspaceId && current) {
     return Promise.resolve(queueEntityUpdate({ workspaceId, entityType: "FOLDER", entityId, payload, current, meta: { folderId } }));
   }
   return xService.update(entityId, payload);
   ```
   `queueEntityUpdate` usa `current.version` como `baseVersion` e devolve a cópia otimista, então o
   `onSuccess` trata as duas saídas igual. `meta` (`folderId`/`itemId`) estreita a invalidação depois.
   Exclusão: `queueEntityDelete({ ..., baseVersion: current.version })`.
3. **Patch otimista na lista** (`onMutate`), porque refetch fica pausado offline: `cancelQueries`,
   guarde `previous`, `setQueryData` com o item alterado/removido, `return { previous }`.
   `onError`: restaure `previous` e `toast.error(getErrorMessage(error))`.
   Item movido entre colunas mexe em duas caches (`useMoveItemToSectionMutation`, em `use-items.ts`).
4. **Toast** que diz a verdade:
   `isOffline() ? "Alteração salva offline — será sincronizada quando a conexão voltar." : "<Pasta> atualizada."`.
5. **Não chame `/sync/push` direto** do hook. `pushImmediate` existe só para limpar o responsável de
   item, e o backend já aceita `assigneeId: null` no `PATCH` (ver `ARCHITECTURE.md` §15) — não crie
   outro uso.

## Passos — tela que atualiza sozinha (pull e SSE)

1. Mudanças de outro dispositivo chegam por `pullChanges` (ao reconectar, a cada 30s) e por SSE
   (`{ type: "change", entityType, entityId, workspaceId }`). As duas vias só **invalidam**; o dado
   vem do refetch REST.
2. Entidade nova cujas queries devem atualizar: um `case "<ENTITY_TYPE>"` em
   `invalidateByEntityChange` (`invalidate-entity.ts`) com as chaves dela, usando as dicas
   `folderId`/`itemId` quando existirem e o prefixo amplo (`byFolderAll()` etc.) quando não.
   `entityType` aqui é `string` (o SSE usa os tipos do log de auditoria, ex.: `WORKSPACE`,
   `CUSTOM_FIELD`, `ITEM_RECURRENCE`). Sem `case`, o `default` invalida tudo do workspace: funciona,
   mas refaz requisições demais.
3. Dado derivado (atividade, estatísticas, início, painéis): já coberto por `invalidateDerivedData`;
   acrescente lá se criar outra tela derivada.
4. Se a chave nova não começa com nenhum prefixo de `invalidateWorkspaceData`, inclua o prefixo
   no `predicate` de lá.

## Testar

Sem testes automatizados no repo: teste no navegador.
1. DevTools → Network → **Offline**; edite; confira o toast "salvo offline", a lista já alterada e o
   contador no `SyncStatusIndicator` (topbar). `localStorage["taskflow.syncOutbox"]` mostra a fila.
2. Volte a **Online**; a fila esvazia e a tela confere com o servidor.
3. Conflito: edite offline numa aba, edite o mesmo item online noutra, reconecte a primeira →
   hoje a versão do servidor vence e aparece o aviso "Uma edição feita offline foi sobrescrita..."
   (`applyResult` em `sync-engine.ts`). `REJECTED` mostra "Uma alteração feita offline
   em <um item/uma pasta...> não pôde ser salva e foi desfeita." (`REJECTED_ENTITY_LABEL`): o
   motivo do servidor vem em inglês e sem `code`, então vai só para o console. `SyncEntityType` novo
   precisa de entrada nesse mapa (o `Record` faz o `tsc` cobrar).
4. Tempo real: duas janelas com usuários diferentes no mesmo workspace; a mudança aparece na outra em segundos.

## Checklist final

- [ ] Entidade suportada pelo backend no sync (tipo em `SyncEntityType`)
- [ ] `current` com `version` lido do cache; `isOffline() && workspaceId && current` antes de enfileirar
- [ ] `meta` com `folderId`/`itemId` quando conhecidos
- [ ] Patch otimista em `onMutate` + rollback em `onError`
- [ ] Toast diferente offline/online
- [ ] `case` em `invalidateByEntityChange` para entityType novo; prefixo novo em `invalidateWorkspaceData`
- [ ] Testado offline → online, conflito e duas janelas
