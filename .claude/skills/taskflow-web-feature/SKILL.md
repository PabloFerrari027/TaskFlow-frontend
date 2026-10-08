---
name: taskflow-web-feature
description: Cria ou estende uma feature do TaskFlow-frontend (Next.js 16 + TanStack Query) seguindo a fatia vertical do repo — tipos em src/types espelhando o DTO da API, service axios sem estado, chave em queryKeys, hooks de query/mutation com invalidação, toast e getErrorMessage, e componentes que só falam com hooks. Use sempre que o pedido for "nova feature", "tela para o endpoint X", "consumir a rota nova do backend", "integrar com a API", "listar/paginar no front", "hook de query", "mutation", "invalidar cache do react-query", "botão que chama a API", ou quando o backend ganhou um módulo novo e o front precisa acompanhar. Para rota, aba, navegação e formulário, veja também taskflow-web-screen; para edição offline, taskflow-web-offline.
---

# Feature nova (ou endpoint novo numa feature)

Referência pequena e completa: `src/features/time-tracking` (service, hooks, 3 componentes) +
`src/types/time-tracking.ts`. Referência grande: `src/features/items`. "Porquê" das regras:
`ARCHITECTURE.md` §3 (camadas), §8 (TanStack Query), §9 (HTTP e erros), §14 (convenções).
Templates: `templates/` (ver `templates/README.md`).

**Idioma**: comentários de código em **inglês** (padrão do repo, ~99% dos comentários);
texto de UI, toasts e mensagens de validação em **pt-BR**. Docs (`ARCHITECTURE.md`) em pt-BR.

## Passos

1. **Contrato primeiro.** Abra a seção do endpoint no `API.md` do backend
   (`C:\Users\Pablo\Projects\TaskFlow-backend\API.md`) e o DTO real no backend se houver dúvida.
   Siga a skill **taskflow-web-api-contract** para tipos e codes de erro novos.

2. **Tipos** em `src/types/<recurso>.ts` (`templates/types.ts.tmpl`): entidade + request/response
   de cada operação, datas como `string` ISO, listas como `PaginatedResult<T>` (`@/types/common`).

3. **Service** em `src/features/<feature>/api/<feature>-service.ts` (`templates/service.ts.tmpl`):
   objeto `xService` com um método `async` por endpoint usando `apiClient` (`@/lib/api/client`),
   devolvendo `data` tipado. Sem estado, sem cache, sem toast. Endpoint público (sem login):
   `{ _skipAuth: true }` na config, como os previews de convite.

4. **Chave de query** em `src/lib/query-keys.ts` (`templates/query-keys.snippet.ts.tmpl`): grupo com
   `root()` e chaves por escopo. Inclua `{ page }` só quando a página importa; sem ela,
   `invalidateQueries` casa como prefixo e invalida todas as páginas. Objeto de filtro grande na
   chave → `stableStringify` (`@/lib/utils`), como `analytics.query`.

5. **Hooks** em `src/features/<feature>/hooks/use-<feature>.ts` (`templates/hooks.ts.tmpl`), arquivo
   `"use client"`:
   - query: `useXQuery`, `queryKey` da fábrica, `placeholderData: keepPreviousData` em lista paginada;
   - um hook por mutation, nome pelo verbo (`useCreateXMutation`, `useArchiveXMutation`...), com
     `onSuccess` (invalidação precisa + `setQueryData` quando a resposta traz a entidade + `toast.success`
     em pt-BR) e `onError: (error) => toast.error(getErrorMessage(error))`. Componente não trata erro de mutation.
   - Invalide também o que DERIVA da mudança: `folderStats`, `home`, `activity`, `analytics`,
     `dashboardPages` quando o dado aparece lá (veja `invalidateDerivedData` em
     `src/features/sync/lib/invalidate-entity.ts`).
   - Paginação: lista que cresce sem limite → paginação real com `<Pager>`; lista pequena →
     `limit: MAX_PAGE_SIZE` (100) + `select: (r) => r.data`.

6. **Componentes** em `src/features/<feature>/components/` (`templates/section.tsx.tmpl`):
   - nunca importam `apiClient` nem chamam a API; usam os hooks;
   - ordem de estados: `Skeleton` → `ErrorState error={q.error} onRetry` → vazio (`EmptyState` ou
     frase curta com o próximo passo) → conteúdo (com `opacity-60` enquanto `isPlaceholderData`);
   - ações que o papel não permite ficam dentro de `<RoleGate allowed={...}>` com a regra de
     `src/lib/permissions.ts` (proteção de UX; a API revalida);
   - destrutivo → `ConfirmDialog` com `variant="destructive"`;
   - estado local escopado a um id (página, rascunho) → quem renderiza passa `key={id}`.

7. **Onde aparece**: tela, aba, item de navegação, formulário e guia do tutorial → skill
   **taskflow-web-screen**.

8. **Verifique** com a skill **taskflow-web-ship** (`npx next typegen && npx tsc --noEmit`,
   `npm run lint`) e veja a tela funcionando no navegador contra a API local.

## Checklist final

- [ ] Tipos em `src/types` batendo com o `API.md`/DTO do backend
- [ ] Service sem estado, um método por endpoint, só `apiClient`
- [ ] Chave nova em `queryKeys` (nenhum array de chave escrito à mão no hook)
- [ ] Um hook por mutation com `onSuccess` (invalidação + toast) e `onError` (`getErrorMessage`)
- [ ] Dados derivados (stats, início, atividade, painéis) invalidados quando afetados
- [ ] Componentes só com hooks; estados carga/erro/vazio/conteúdo; `RoleGate` nas ações
- [ ] Texto de UI em pt-BR simples, sem id/code/enum cru; comentários em inglês
- [ ] `key={id}` onde há estado local por id
- [ ] tsc (após `next typegen`) e lint limpos; testado no navegador
