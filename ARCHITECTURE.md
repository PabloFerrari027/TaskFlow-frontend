# TaskFlow Frontend — Documentação de Arquitetura

Este documento detalha a arquitetura, convenções e domínios do frontend do TaskFlow. Complementa o [README.md](./README.md) (setup rápido) e o `API.md` do backend (contrato da API consumida).

## Índice

1. [Stack e visão geral](#1-stack-e-visão-geral)
2. [Estrutura de pastas](#2-estrutura-de-pastas)
3. [Arquitetura em camadas](#3-arquitetura-em-camadas)
4. [Roteamento (App Router)](#4-roteamento-app-router)
5. [Autenticação e sessão](#5-autenticação-e-sessão)
6. [Autorização e papéis](#6-autorização-e-papéis)
7. [Workspace atual](#7-workspace-atual)
8. [Camada de dados: TanStack Query](#8-camada-de-dados-tanstack-query)
9. [Cliente HTTP e tratamento de erros](#9-cliente-http-e-tratamento-de-erros)
10. [Sincronização offline](#10-sincronização-offline)
11. [Domínios de negócio (features)](#11-domínios-de-negócio-features)
12. [UI, design system e tema](#12-ui-design-system-e-tema)
13. [Formulários e validação](#13-formulários-e-validação)
14. [Convenções de código](#14-convenções-de-código)
15. [Limitações conhecidas](#15-limitações-conhecidas)

---

## 1. Stack e visão geral

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Linguagem | TypeScript (strict) |
| Estilo | Tailwind CSS v4, tokens em OKLCH, dark mode via `next-themes` |
| Componentes | shadcn/ui (estilo `radix-nova`) sobre Radix UI (`radix-ui`) |
| Estado de servidor | TanStack Query v5 (+ devtools) |
| Formulários | react-hook-form + zod (`@hookform/resolvers`) |
| HTTP | axios, instância única com interceptors |
| Ícones | lucide-react |
| Datas | date-fns (locale `pt-BR`) |
| Toasts | sonner |
| Gráficos | Recharts, via o wrapper `chart` do shadcn/ui (`src/components/ui/chart.tsx`, instalado com `npx shadcn add chart`) |

O app é 100% client-rendered nas rotas autenticadas (todas as páginas do dashboard são `"use client"`); a landing page (`/`) e as páginas de erro (`/403`, `not-found`) são Server Components estáticos. Não há Route Handlers nem Server Actions — todo acesso a dados passa pela API REST do backend TaskFlow via axios.

`AGENTS.md`/`CLAUDE.md` no repo instruem a checar `node_modules/next/dist/docs/` antes de mudanças que dependam de convenções do Next — esta versão usa `LayoutProps<"/rota">` / `PageProps<"/rota">` gerados automaticamente (ver `next-env.d.ts` / `.next/types`) para tipar `params` de layouts e páginas dinâmicas, em vez dos tipos manuais mais antigos.

## 2. Estrutura de pastas

```
src/
  app/                    # Rotas (App Router)
  components/
    ui/                   # Primitivos shadcn/ui (não editar manualmente — gerados via `shadcn`)
    layout/                # Sidebar, topbar, navegação
    marketing/             # Seções da landing page
    shared/                 # Componentes reutilizáveis entre features (badges, empty/error state, pager...)
  features/<domínio>/
    api/                  # *-service.ts — chamadas axios cruas, 1:1 com endpoints da API
    hooks/                # use-*.ts — hooks de TanStack Query (queries/mutations) que envolvem o service
    components/           # Componentes de UI específicos do domínio
    context/               # Providers de contexto React (quando aplicável)
    schemas.ts             # Schemas zod + tipos de formulário
    lib/                    # Lógica auxiliar específica do domínio (ex.: sync engine)
  lib/                     # Infraestrutura transversal (HTTP client, auth, permissões, erros, formatação)
  providers/               # Providers globais (Query, Theme)
  types/                   # Tipos alinhados 1:1 aos DTOs da API
```

Features existentes: `auth`, `sessions`, `workspaces`, `projects`, `tasks`, `sections`, `custom-fields`, `comments`, `activity`, `analytics`, `automations`, `assistant`, `admin`, `sync`, `realtime`, `tutorial`.

## 3. Arquitetura em camadas

Fluxo de dados unidirecional e estrito:

```
Componente (UI)
   → hook do TanStack Query (features/<domínio>/hooks/use-*.ts)
      → service (features/<domínio>/api/*-service.ts)
         → apiClient (src/lib/api/client.ts, axios)
            → API TaskFlow (NEXT_PUBLIC_API_URL)
```

Regras que o código segue consistentemente:

- **Componentes nunca importam axios nem `apiClient` diretamente** — sempre passam por um hook.
- **Services são funções puras sem estado**, sem cache: só mapeiam um endpoint HTTP para um método tipado (request/response batem com `src/types`).
- **Hooks concentram toda a lógica de cache**: `queryKey`, invalidação após mutação, toasts de sucesso/erro, e — em várias mutações de `tasks`/`sections`/`projects`/`custom-fields`/`comments` — o desvio para a fila offline quando `navigator.onLine` é falso (ver [§10](#10-sincronização-offline)).
- **Tipos em `src/types`** espelham os DTOs documentados no `API.md` do backend; cada arquivo (`task.ts`, `project.ts`, `workspace.ts`...) tem as interfaces de entidade + request/response de cada operação.

## 4. Roteamento (App Router)

### Árvore de rotas

```
/                                          Landing page (marketing, público)
/login                                     Login (e-mail/senha) — RequireGuest
/login/verify                              2º fator (código de e-mail)
/register                                  Cadastro — RequireGuest
/verify-email                              Confirmação de e-mail pós-cadastro
/403                                       Acesso negado (estático)
/invite/workspace/[token]                  Preview + aceite de convite de workspace (público, aceite exige login)
/invite/project/[token]                    Preview + aceite de convite de projeto (idem)

(dashboard)/                               Layout protegido — RequireAuth + CurrentWorkspaceProvider + SyncProvider
  /dashboard                               Home: projetos ativos do workspace atual
  /workspaces                              Lista de workspaces do usuário (destino padrão pós-login); clicar num card o define como workspace atual
  /workspaces/[workspaceId]                Detalhe: apenas membros + convites, como duas seções empilhadas (sem tabs)
  /activity                                Atividade do workspace atual (linha do tempo paginada)
  /automations                             Automações do workspace atual (item da sidebar só para OWNER/ADMIN; a própria página também bloqueia acesso direto por URL)
  /developers                              Chaves de API + webhooks do workspace atual (mesmo gate OWNER/ADMIN que /automations)
  /assistant                               Liga/desliga o assistente de IA do workspace atual (toggle só para OWNER; página visível a todos)
  /projects                                Todos os projetos do workspace (ativos + arquivados)
  /projects/[projectId]/                   Layout do projeto: header, tabs, TaskDetailSheet global
    (index)                                Redirect → /tasks
    /tasks                                 Quadro Kanban (TaskBoard)
    /tasks/[taskId]                        Página cheia de detalhe da tarefa
    /members                               Membros do projeto
    /invitations                           Convites do projeto
    /custom-fields                         Campos personalizados do projeto
  /analytics                               Dashboard analítico do workspace atual
  /settings/sessions                       Sessões ativas do usuário
  /settings/security                       Alterar senha / definir primeira senha (conta Google-only) / vincular Google (conta com senha)
  /settings/plan                           Escolher/trocar o próprio plano de tokens de IA (PATCH /plans/me) + histórico de consumo
  /tutorial                                Guias por tema (accordion) + botão para refazer o tour guiado
  /admin/clients                           Gestão de clientes (apenas SUPER_ADMIN)
  /admin/clients/[clientId]                Detalhe do cliente: dados básicos, atribuição de plano, histórico de uso de IA (apenas SUPER_ADMIN)
  /admin/plans                             CRUD de planos de tokens de IA — criar, editar teto, listar (apenas SUPER_ADMIN)
```

### Guards

- **`RequireAuth`** (`features/auth/components/require-auth.tsx`): redireciona para `/login?next=<path>` se não autenticado; mostra spinner enquanto `isLoading`. Envolve todo o grupo `(dashboard)`.
- **`RequireGuest`** (`require-guest.tsx`): o inverso — usado em `/login` e `/register`; redireciona usuários já autenticados para `getSafeRedirectPath(next)`.
- **`/admin/clients`**: não tem guard próprio de rota — a proteção acontece via `useIsSuperAdminQuery` (ver [§6](#6-autorização-e-papéis)) e o item de navegação só aparece na sidebar se a query tiver sucesso; se o usuário acessar a URL diretamente sem ser super admin, `ClientsTable` detecta o 403 da API e redireciona para `/403`.
- **`/admin/plans`** e **`/admin/clients/[clientId]`**: mesmo padrão — sem `useIsSuperAdminQuery` própria, cada página detecta o 403 do próprio endpoint que já usa (`GET /admin/plans`, `GET /admin/clients/:id` — ambos SUPER_ADMIN-only) e redireciona para `/403`.
- **`/automations`** e **`/developers`**: o item de sidebar já filtra por `workspacePermission` (`nav-items.ts`, avaliado contra o papel do usuário no workspace atual), mas isso só esconde o link — quem acessa a URL direto sem ser OWNER/ADMIN vê um `EmptyState` de "Acesso restrito" renderizado pela própria página, sem round-trip à API (a checagem usa o mesmo `workspace.members` já carregado por `useCurrentWorkspace`).

### Padrões notáveis de rota

- **`layout.tsx` de `[projectId]`** carrega o projeto uma vez (`useProjectQuery`) e renderiza header/tabs/ações (editar, arquivar) para todas as sub-rotas; também monta `<TaskDetailSheet>`, um painel lateral global controlado por query string (`?taskId=`, via `useTaskPanel`) que funciona em qualquer página aninhada do projeto — permite abrir uma tarefa em painel sem navegar para fora do quadro.
- **`ProjectIndexPage`** (`/projects/[projectId]`) é um Server Component só com `redirect()` para `/tasks` — não há dashboard próprio de projeto.
- Páginas dinâmicas usam `use(props.params)` (API do React 19) para desembrulhar `params` em Client Components, em vez de recebê-lo como prop assíncrona diretamente.

## 5. Autenticação e sessão

### Fluxo de login

1. `POST /auth/login` (`authService.login`) retorna um `challengeId` (login sempre exige 2º fator por código de e-mail) → usuário é levado para `/login/verify`.
2. `POST /auth/login/verify` (`useVerifyTwoFactorMutation`) troca o código pelo par `accessToken`/`refreshToken` + `sessionId`, persistidos via `setSession`.
3. Login com Google (`GoogleSignInButton`) carrega o script `accounts.google.com/gsi/client` sob demanda e troca o `idToken` por tokens via `POST /auth/login/google` — pula o 2º fator. Só renderiza se `NEXT_PUBLIC_GOOGLE_CLIENT_ID` estiver definido.

### Armazenamento de sessão (`src/lib/auth/token-store.ts`)

Store singleton em memória (não é React state) com um padrão pub/sub manual, consumido via `React.useSyncExternalStore` em `AuthProvider`:

- `accessToken`: só em memória — nunca persistido (evita expor o JWT ativo em `localStorage`).
- `sessionId` + `refreshToken`: persistidos em `localStorage` (`taskflow.session`) para sobreviver a reload.
- Ao montar, `AuthProvider` chama `hydrateFromStorage()` e, se havia sessão persistida, dispara `attemptSessionRefresh()` para obter um novo `accessToken` sem exigir novo login.

### Refresh automático (`src/lib/api/client.ts`)

O interceptor de resposta do `apiClient` trata qualquer `401` (exceto no próprio `/auth/refresh`, e exceto requests marcados `_skipAuth`):

1. Marca a request original com `_retried` (evita loop).
2. Deduplica refreshes concorrentes com uma única `refreshPromise` compartilhada.
3. Reenvia a request original com o novo token se o refresh funcionar.
4. Se o refresh falhar, limpa a sessão e faz `window.location.href = /login?next=...` (hard redirect — fora do React Router, propositalmente: descarta todo estado do TanStack Query também).

O `accessToken` é injetado em toda request via interceptor de request, exceto quando `config._skipAuth` é `true` (usado nos endpoints públicos de preview de convite).

### Verificação de e-mail

Cadastro (`/register`) → `POST /auth/register` cria a conta em `PENDING_VERIFICATION` → `/verify-email` (`VerifyEmailForm`) confirma com código de 6 dígitos → login liberado. Se o usuário tentar logar antes de confirmar, `LoginForm` detecta o código de erro `EMAIL_NOT_VERIFIED` e redireciona automaticamente para `/verify-email`.

### `useAuth()` (`src/lib/auth/auth-context.tsx`)

Expõe `{ isLoading, isAuthenticated, userId, email, signOut }`. `userId`/`email` vêm da decodificação client-side do JWT (`decodeJwt`, base64url manual — sem lib) — **não há endpoint de perfil**, então esses são os únicos dados de identidade disponíveis (ver [§15](#15-limitações-conhecidas)).

## 6. Autorização e papéis

Modelo de papéis (`src/types/workspace.ts`, `src/types/project.ts`):

- **Workspace**: `OWNER` > `ADMIN` > `MEMBER` > `GUEST`.
- **Projeto**: apenas `MEMBER` / `GUEST` — **não existe papel elevado no nível de projeto**. Toda ação de gestão de projeto (editar, arquivar, gerenciar membros/convites/custom fields) é autorizada pelo papel do usuário no **workspace pai**, não no projeto.

`src/lib/permissions.ts` centraliza essa lógica em funções puras (`canManageWorkspace`, `canDeleteWorkspace` — exige `OWNER` especificamente, `canInviteWorkspaceMembers`, `canManageProjectMembers`, `canManageCustomFields`, `canArchiveProject`, `isLastOwner`). `features/projects/hooks/use-project-permission.ts` busca o workspace do projeto e aplica `canManageWorkspace` ao papel do usuário nele.

Componente `RoleGate` (`components/shared/role-gate.tsx`) é o padrão de UI: `<RoleGate allowed={canManage}>...</RoleGate>` esconde ações que o usuário não pode executar (proteção de UX — a API sempre revalida no servidor).

### Super admin

Não há endpoint que exponha o papel de plataforma do usuário logado (`PlatformRole`), e o `RolesGuard` do backend revalida no servidor a cada request em vez de embutir isso no JWT. `useIsSuperAdminQuery` (`features/admin/hooks/use-clients.ts`) infere acesso **tentando** `GET /admin/clients?limit=1`: sucesso = super admin, 403 = não. O item "Clientes" na sidebar só aparece se essa query tiver sucesso (`isSuccess`).

## 7. Workspace atual

`CurrentWorkspaceProvider` (`features/workspaces/context/current-workspace-context.tsx`) mantém o workspace selecionado (`workspaceId`) em `localStorage` (`taskflow.currentWorkspaceId`) e auto-seleciona o primeiro workspace da lista se nenhum estiver salvo ou se o salvo não existir mais na lista do usuário. Envolve todo o grupo `(dashboard)`, junto com `SyncProvider`. `WorkspaceSwitcher` na topbar consome esse contexto para trocar de workspace.

## 8. Camada de dados: TanStack Query

`QueryProvider` (`src/providers/query-provider.tsx`) configura um `QueryClient` por navegador (singleton fora de SSR) com defaults:

```ts
staleTime: 30_000, retry: 1, refetchOnWindowFocus: false   // queries
retry: 0                                                    // mutations
```

### `queryKeys` (`src/lib/query-keys.ts`)

Fábrica central e tipada de chaves — nenhum hook constrói arrays de chave manualmente. Padrões notáveis:

- Chaves de listas paginadas (`tasks.all`, `workspaces.invitations`, `projects.invitations`, `tasks.bySection`, `activity.*`, `comments.all`) só incluem `{ page }` quando a página é relevante para a invalidação; omitir a página faz `invalidateQueries` casar como prefixo e invalidar todas as páginas de uma vez.
- `tasks.bySectionAll()` é um prefixo deliberadamente "solto" (`["tasks", "section"]`, sem `sectionId`) usado para invalidar todas as colunas do quadro de uma vez quando não se sabe exatamente quais seções foram afetadas (criação/movimentação de tarefa).
- `analytics.query(request)` serializa o `AnalyticsQuery` inteiro com `stableStringify` (`src/lib/utils.ts` — `JSON.stringify` com as chaves de cada objeto ordenadas recursivamente) em vez de embutir o objeto cru na chave. Os hooks especializados de `use-analytics.ts` montam o mesmo request lógico com ordens de propriedade diferentes; sem essa normalização, duas queries idênticas na prática virariam entradas de cache distintas.

### Atualização otimista em cache de lista (`onMutate`/`onError`)

Além de `setQueryData` no `onSuccess` (que atualiza a query de **detalhe** assim que a mutação resolve, seja ela online ou uma cópia otimista devolvida por `queueEntityUpdate`), as mutações de **edição/exclusão que afetam uma lista** (`sections`, `comments`, `custom-fields`, `projects`, e o caso especial de `useMoveTaskToSectionMutation` em `tasks`) também aplicam o patch diretamente na(s) query(ies) de lista via `onMutate`, com rollback em `onError`:

```ts
onMutate: async (vars) => {
  await queryClient.cancelQueries({ queryKey: queryKeys.<dominio>.all(id) });
  const previous = queryClient.getQueryData<PaginatedResult<T>>(queryKeys.<dominio>.all(id));
  if (previous) {
    queryClient.setQueryData(queryKeys.<dominio>.all(id), { ...previous, data: /* filtrado ou merged */ });
  }
  return { previous };
},
onError: (error, vars, context) => {
  if (context?.previous) queryClient.setQueryData(queryKeys.<dominio>.all(id), context.previous);
  toast.error(getErrorMessage(error));
},
```

Isso existe porque `invalidateQueries` sozinho **não** é suficiente offline: o `QueryClient` roda com `networkMode: "online"` (padrão), então o refetch disparado por uma invalidação fica pausado (`fetchStatus: "paused"`) enquanto o navegador está offline — sem o patch otimista, um item apagado/editado offline continuaria visível na lista até a próxima reconexão, mesmo a mutação já tendo sido enfileirada com sucesso no outbox. Ver [§10](#10-sincronização-offline) para o caso mais elaborado (`useMoveTaskToSectionMutation`, que precisa mover o item entre duas caches de coluna diferentes).

### Padrão de paginação

Duas estratégias coexistem, escolhidas por domínio conforme o volume de dados esperado:

- **Paginação real** (mantém `page` em state, usa `<Pager>`): tarefas de um projeto/seção, convites, atividade, clientes (admin) — listas que podem crescer sem limite.
- **"Fetch tudo de uma vez"** (busca com `limit: MAX_PAGE_SIZE` — 100 — e usa `select` para expor só `.data`): workspaces do usuário, seções de um projeto, custom fields, subtarefas, comentários de uma tarefa, sessões — listas realisticamente pequenas, evitando UI de paginação desnecessária.

### Invalidação após mutação

Cada hook de mutação invalida precisamente as queries afetadas (ex.: `useUpdateTaskMutation` invalida `tasks.detail`, `tasks.all(projectId)` e `tasks.bySectionAll()` porque a seção pode ter mudado). Mutações que retornam a entidade atualizada frequentemente usam `setQueryData` para atualizar o cache imediatamente, além de invalidar listas relacionadas.

## 9. Cliente HTTP e tratamento de erros

### `apiClient` (`src/lib/api/client.ts`)

Instância axios única, `baseURL` de `NEXT_PUBLIC_API_URL`. Duas flags de config customizadas (via `declare module "axios"`):

- `_skipAuth`: pula a injeção do `Authorization` header (usado nos endpoints públicos de preview de convite).
- `_retried`: marca requests já reprocessadas pelo interceptor de refresh, evitando loop infinito.

Uma segunda instância (`refreshClient`) é usada só para `POST /auth/refresh`, para que ela nunca reentre no próprio interceptor de resposta.

### `src/lib/errors.ts`

`getErrorMessage(error)` mapeia cada `ErrorCode` do domínio (definido em `src/types/common.ts`, ~45 códigos — `INVALID_CREDENTIALS`, `TASK_HAS_PENDING_SUBTASKS`, `SYNC_VERSION_CONFLICT` etc.) para uma mensagem amigável em pt-BR; cai para a mensagem da API ou uma genérica se o código for desconhecido, e trata erros de rede (sem `response`) separadamente. `getErrorCode(error)` extrai só o código, usado por telas que precisam de lógica condicional (ex.: `LoginForm` redirecionando em `EMAIL_NOT_VERIFIED`).

`isDomainError` (`types/common.ts`) faz o type-narrowing entre a resposta de erro de domínio (`{ code, message }`) e a de validação padrão do NestJS (`{ message: string[] }`).

## 10. Sincronização offline

A feature mais sofisticada do app. Implementa suporte a uso offline via o endpoint `/sync/push` + `/sync/pull` documentado no `API.md` (§13), **não** como uma camada geral de todas as operações — é aplicada seletivamente.

### O que é suportado offline

**Apenas edição/exclusão de entidades já existentes**: tarefa, projeto, seção e definição de custom field (edição), e exclusão de tarefa, seção e comentário. **Criar** qualquer entidade nova permanece online-only — criar offline exigiria id gerado no cliente + renderização otimista de listas + reconciliação de id, uma feature maior e distinta. Valores de custom field em tarefas também ficam online-only: ao contrário de toda outra entidade do §13, não têm campo `version`, então não há `baseVersion` para chave de concorrência otimista.

### Peças do motor (`features/sync/`)

- **`lib/outbox.ts`** — fila persistida em `localStorage` (`taskflow.syncOutbox`). `enqueueOperation` funde uma segunda edição offline da mesma entidade na operação `UPDATE` já pendente (em vez de empilhar), evitando que a segunda operação carregue o mesmo `baseVersion` da primeira e gere um `CONFLICT` falso contra a versão que a própria primeira operação acabou de produzir no servidor.
- **`lib/device-id.ts`** — id estável por navegador (`crypto.randomUUID()`, persistido), enviado em toda `SyncOperation.deviceId`.
- **`lib/cursor.ts`** — cursor de pull por workspace (`taskflow.syncCursor.<id>`); ausente = "nunca puxado" (equivalente documentado a `since=0`).
- **`lib/sync-engine.ts`** — orquestra tudo:
  - `queueEntityUpdate` / `queueEntityDelete`: enfileiram uma operação e devolvem uma cópia otimista da entidade (para o `onSuccess` da mutação atualizar o cache como se fosse online).
  - `pushImmediate`: envia uma única operação via `/sync/push` mesmo estando online — usado exclusivamente para limpar `assigneeId` de uma tarefa, a única escrita que a superfície REST não consegue expressar (`PATCH /tasks/:id` nunca aceita `assigneeId: null`; omitir o campo mantém o responsável atual).
  - `flushOutbox`: agrupa operações pendentes por workspace, envia cada grupo, reconcilia o cache por resultado (`APPLIED`/`CONFLICT`/`REJECTED`/`DUPLICATE`) e remove do outbox só o que o servidor de fato respondeu — o que falhar por estar ainda offline permanece na fila.
  - `pullChanges`: pagina `/sync/pull` até `hasMore` ser falso; como o formato de uma mudança é opaco (`SyncChange = Record<string, unknown>`), qualquer pull não-vazio simplesmente invalida os grupos de query relevantes (tarefas, projetos, seções, custom fields, comentários, atividade, analytics) em vez de tentar mesclar campo a campo — os endpoints REST continuam sendo a fonte de verdade. `activity`/`analytics` entram na mesma lista mesmo sendo só leitura: ambos derivam dos mesmos eventos de domínio que geraram as outras mudanças, então um dispositivo que puxou alterações de outro ficaria com o feed de atividade ou o dashboard desatualizados até o `staleTime` expirar naturalmente, se não fossem invalidados junto.
- **`lib/invalidate-entity.ts`** — único lugar com o mapeamento `entityType → queryKeys`. `invalidateByEntityChange` é chamado tanto pelo `flushOutbox`/`pushImmediate` (via `invalidateForEntity`, com dicas `projectId`/`taskId` vindas do `meta` da operação) quanto pelo listener de [tempo real](#tempo-real-sse) (sem dicas — cai no prefixo mais amplo, ex. `queryKeys.tasks.byProjectAll()`). `entityType` é `string`, não `SyncEntityType`: o canal de tempo real usa os tipos do log de auditoria (inclui `WORKSPACE` e `CUSTOM_FIELD`); um tipo desconhecido invalida tudo do workspace em vez de chutar um mapeamento estreito. `invalidateDerivedData` invalida atividade + analytics, que dependem de qualquer outra entidade.
- **`context/sync-context.tsx`** (`SyncProvider`) — dispara `flushOutbox` + `pullChanges` sempre que o navegador fica online, e a cada 30s como rede de segurança caso o evento `online` não dispare (ex.: aba que nunca recebeu o evento). Expõe `{ isOnline, pendingCount, isSyncing, syncNow }` via `useSync()`.
- **`components/sync-status-indicator.tsx`** — ícone na topbar (nuvem cortada / spinner / refresh com badge de contagem) que também permite forçar sync manual.

### Como os hooks de domínio decidem online vs. offline

Cada mutação elegível (`useUpdateTaskMutation`, `useChangeTaskStatusMutation`, `useMoveTaskToSectionMutation`, `useUnassignTaskMutation`, `useUpdateSectionMutation`, `useDeleteSectionMutation`, `useUpdateProjectMutation`, `useArchiveProjectMutation`, `useUpdateCustomFieldOptionsMutation`, `useArchiveCustomFieldMutation`, `useDeleteCommentMutation`) segue o mesmo padrão: se `isOffline()` (checa `!navigator.onLine`) **e** há um workspace atual **e** a entidade já está em cache, chama `queueEntityUpdate`/`queueEntityDelete` em vez do service HTTP; senão, segue o caminho REST normal. O toast de sucesso também muda de texto ("salvo offline — será sincronizado...") para deixar claro ao usuário que a alteração ainda não chegou ao servidor.

`SECTION`, `COMMENT` e `TASK` suportam exclusão via sync (`TASK` é *soft delete*; online, tarefas são apagadas por `POST /tasks/bulk-delete`, então a exclusão de tarefa via sync só é usada pela fila offline de `useDeleteTasksMutation`) — `PROJECT` e `CUSTOM_FIELD_DEFINITION` sempre voltam `REJECTED` se uma `DELETE` for enfileirada para eles (por isso essas duas entidades só têm mutações de *edição* offline: arquivar, não apagar).

### Caso especial: mover tarefa entre colunas offline (`useMoveTaskToSectionMutation`)

O quadro Kanban renderiza cada seção como uma query paginada independente (`tasks.bySection(sectionId, page)`) — uma tarefa "pertence" à cache da sua coluna, não a uma lista única do projeto. Uma movimentação entre colunas offline precisa, portanto, tocar **duas** caches ao mesmo tempo: remover o item da coluna de origem e inseri-lo na de destino. `onMutate` faz isso varrendo toda página atualmente em cache sob o prefixo `tasks.bySectionAll()` (`queryClient.getQueriesData` com matching parcial de chave) até achar a tarefa, removendo-a de onde estava, e inserindo uma cópia (com `sectionId` já atualizado) em toda página em cache da seção de destino — ajustando `meta.total`/`meta.totalPages` dos dois lados. Reordenar dentro da **mesma** coluna não recebe esse tratamento: o item nunca desaparece nesse caso, só assenta na posição exata quando o próximo `pullChanges` reconciliar — um `onMutate` que reordenasse com precisão dentro de uma página paginada teria risco/complexidade desproporcional ao ganho.

### Tempo real (SSE)

Camada **aditiva** sobre o offline-first (`features/realtime/`): quando outro usuário/dispositivo altera algo, a tela atualiza em segundos sem F5 nem esperar o polling de 30s. Não substitui nada acima — `SyncProvider` (polling de 30s), outbox e `isOffline()` continuam idênticos.

- **`api/realtime-service.ts`** — `requestTicket(workspaceId)` (`POST /workspaces/:id/realtime/ticket` → `{ ticket, expiresInSeconds }`) e `streamUrl(ticket)`. A URL do stream usa o `baseURL` da API (origem do backend, não a do Next.js) e leva **só o ticket** — nunca o access token, já que `EventSource` não manda `Authorization`.
- **`hooks/use-realtime-connection.ts`** — abre um `EventSource` para o workspace atual e reabre (ticket novo) quando ele muda; não conecta enquanto o navegador está offline (o efeito reexecuta quando `isOnline` volta). Montado uma vez pelo `RealtimeConnector` (componente que renderiza `null`) no layout do dashboard — o desmonte no logout fecha a conexão.
- **Frames** (JSON em `data:`, sem campo `event:`, então tudo chega em `onmessage`): `{ type: "sync" }` (primeiro frame de toda conexão → `pullChanges` imediato) e `{ type: "change", entityType, entityId, eventType, workspaceId, occurredAt }` → `invalidateByEntityChange` + `invalidateDerivedData`. O canal **nunca é fonte de dado**, só dispara invalidação; o dado vem do refetch REST normal, que revalida autorização. Sinais de outro workspace são ignorados, e vários `change` em rajada de 150ms são agrupados para cada query refetchar uma vez só.
- **Reconexão manual, não a nativa do `EventSource`**: o ticket é de uso único (TTL 30s). O retry nativo do navegador reusaria a mesma URL com um ticket já consumido, receberia 401 e desistiria de vez (`readyState` `CLOSED`). Por isso, em qualquer `error` o hook fecha a fonte, e pede ticket novo após backoff exponencial com jitter (1s → 30s, zera ao reconectar). Ao reabrir após um erro ele também dispara `pullChanges`, redundante com o `sync` do servidor de propósito (as duas chamadas simultâneas compartilham a mesma execução em andamento).

## 11. Domínios de negócio (features)

| Feature | Endpoints principais | Observações |
|---|---|---|
| **auth** | `/auth/register`, `/verify-email`, `/login`, `/login/verify`, `/login/google` | 2FA por e-mail obrigatório no login por senha; Google pula o 2FA. |
| **auth (senha)** | `PATCH /auth/password`, `POST /auth/password` | `SecuritySettingsSection` em `/settings/security` escolhe o formulário por `hasPassword` (`GET /auth/me`): com senha → alterar (senha atual + nova; `CURRENT_PASSWORD_INCORRECT` vira erro no campo); sem senha → definir (nova senha + ID Token do Google via `useGoogleIdentityToken`, o mesmo hook do `ReauthDialog`; o token vai direto na requisição, sem estado). Ambos revogam as outras sessões (a atual continua válida); definir invalida `GET /auth/me`. Só existe em Configurações — nunca linkado a partir do chat do assistente. |
| **auth (vincular Google)** | `POST /auth/google-link` | Segundo card de `SecuritySettingsSection`, só com `hasPassword && !googleLinked` (com `googleLinked` mostra apenas "Conta Google vinculada"; desvincular não existe). Senha atual + ID Token via `useGoogleIdentityToken` (o botão do Google é o submit). `CURRENT_PASSWORD_INCORRECT` vira erro no campo; `GOOGLE_ACCOUNT_ALREADY_LINKED`/`INVALID_GOOGLE_TOKEN` viram toast. Revoga as outras sessões e invalida `GET /auth/me`. |
| **sessions** | `/auth/sessions` | Lista/revoga sessões (dispositivos); `useLogout` revoga a sessão atual (best-effort) e sempre limpa o estado local mesmo se a chamada falhar. |
| **workspaces** | `/workspaces`, `/workspaces/:id`, `/members`, `/invitations`, `/assistant-settings` | CRUD + membros + convites; exclusão exige workspace vazio (só o `OWNER` sozinho) e papel `OWNER`. `assistantEnabled` (`PATCH /workspaces/:id/assistant-settings`, só `OWNER`) liga/desliga o [assistente de IA](#assistente-de-ia-com-ações) para o workspace — nasce `false` em todo workspace novo, e o backend também pode desligar sozinho (kill switch, ver abaixo); reativar sempre exige um `OWNER` de novo, nunca é automático. UI: página própria `/assistant` (`WorkspaceAssistantSettingsPanel`), visível a todos os papéis (o toggle em si só fica habilitado para `OWNER`). O seletor de papel de membro existente (`MembersTable`) só lista/permite `OWNER` quando quem está agindo já é `OWNER` (`canGrantOwnerRole` em `src/lib/permissions.ts`) — vale tanto para promover quanto para rebaixar um `OWNER` existente, espelhando a mesma regra do backend. |
| **projects** | `/workspaces/:id/projects`, `/projects/:id`, `/archive`, `/move` (PATCH), `/members`, `/invitations` | Sem exclusão — só arquivamento (`ProjectStatus: ACTIVE \| ARCHIVED`). Papel de gestão herdado do workspace ([§6](#6-autorização-e-papéis)). Hierárquico (`parentId`) — ver [Hierarquia](#hierarquia-projetos-seções-e-comentários). |
| **sections** | `/projects/:id/sections`, `/sections/:id`, `/sections/:id/move` (PATCH) | Colunas do quadro Kanban; uma seção "padrão" (`isDefault`) não pode ser apagada; exclusão exige seção vazia (sem tarefas nem subseções — `SECTION_HAS_CHILDREN`). Hierárquica (`parentId`) — **protótipo**, ver [Hierarquia](#hierarquia-projetos-seções-e-comentários). |
| **tasks** | `/projects/:id/tasks`, `/tasks/:id`, `/tasks/:id/status`, `/tasks/:id/subtasks`, `/tasks/:id/attachments`, `/tasks/:id/cover` | Entidade central. Suporta subtarefas (`parentTaskId`), anexos (upload multipart, limite de 20MB, download via blob), capa (imagem JPEG/PNG/WebP até 10MB, `PUT/GET/DELETE`; o binário é autenticado, então é buscado como blob e o cache é chaveado por `version`), prioridade e prazo (uma vez definidos, só podem ser trocados por outro valor — não removidos pela API). |
| **custom-fields** | `/projects/:id/custom-fields`, `/custom-fields/:id/options`, `/archive`, `/tasks/:id/custom-field-values` | Tipos: `TEXT`, `NUMBER`, `DATE`, `SINGLE_SELECT`, `MULTI_SELECT`, `CHECKBOX`, `PEOPLE`. Arquivamento em vez de exclusão. |
| **comments** | `/tasks/:id/comments`, `/comments/:id` | Sem `version` (não versionado) — exclusão offline sempre reaplica ao sincronizar; a UI remove o comentário do cache otimisticamente (`onMutate`) porque o `invalidateQueries` sozinho não refetcha enquanto offline. Autor **ou** `OWNER`/`ADMIN` do workspace pode apagar (`canManageWorkspace`); a API sempre revalida. Criação é sempre online-only, como toda entidade do app — nunca passa pelo outbox. Respostas em thread via `parentId` (ver [Hierarquia](#hierarquia-projetos-seções-e-comentários)); a API bloqueia apagar um comentário que ainda tem respostas (`COMMENT_HAS_CHILDREN`). |
| **activity** | `/workspaces/:id/activity`, `/tasks/:id/activity` | Feed de auditoria paginado (genuinamente ilimitado — cresce a cada edição de status/responsável/movimentação/comentário). O endpoint de tarefa devolve uma timeline **unificada**: eventos de `comments.comment_created` aparecem tanto no feed de atividade quanto no `CommentList` acima dele — repetição intencional (mesmo padrão do GitHub/Linear: o feed é o resumo cronológico, os comentários acima são o conteúdo completo). `describeActivityEntry` (`activity-event-label.ts`) traduz `eventType` para pt-BR por correspondência de substring. **Confirmado contra o código do backend** (`task.events.ts`/`comment.events.ts`): todo `eventType` é uma string literal fixa por classe de evento, sem transformação entre o evento de domínio e a resposta da API — o backend é consistente e bate exatamente com o `API.md` § 14. A correspondência por substring é defensiva por escolha (tolera um `eventType` novo ou uma troca de chave de payload sem exigir deploy do frontend em lockstep), não uma correção para uma inconsistência real — não é "gambiarra" a simplificar para um mapa exato. |
| **analytics** | `/analytics/query` (POST), `/analytics/query/natural-language` (POST) | Query builder genérico: `entity` (`tasks`\|`projects`) + `filters` + `groupBy` + `metrics`. Hooks especializados (`use-analytics.ts`) montam queries prontas — `useTotalTasksCountQuery`, `useCompletedTaskCountQuery`, `useTasksByStatusQuery`, `useTasksByAssigneeQuery`, `useTasksByProjectQuery`, `useOverdueTasksByProjectQuery`, `useProjectsByStatusQuery` — nenhum componente monta um `AnalyticsQuery` manualmente. Toda query exige `workspaceId` (`enabled: false` se ausente) e usa `staleTime: 60_000` (o dobro do default) porque dado agregado muda menos que uma leitura de entidade individual. `NaturalLanguageQueryBox` (no topo do dashboard) traduz uma pergunta em texto livre para o mesmo `AnalyticsQuery` via IA (backend), que executa o mesmo pipeline/whitelist de `POST /analytics/query`; a interpretação (`query`) é sempre exibida ("Entendi como: ...") antes do resultado, nunca escondida. Sem `groupBy` o resultado vira `StatCard`s, com `groupBy` um `CategoryBarChart` (top 10) — os mesmos componentes dos gráficos fixos, sem renderer próprio. Uma métrica `derived` pode vir `null` por grupo (dado insuficiente): grupos `null` são omitidos do gráfico e o `StatCard` mostra "Sem dados", nunca `0` (`features/analytics/lib/derived-metrics.ts` formata taxas como percentual e durações como "3d 4h"). É uma mutação (`useNaturalLanguageQueryMutation`), não uma query — cada pergunta é uma ação nova, e o resultado fica só em `mutation.data`, nunca no cache do TanStack Query. Erros por código: `AI_RATE_LIMIT_EXCEEDED`, `AI_TRANSLATION_FAILED`, `INVALID_ANALYTICS_QUERY` (mensagem própria nesse contexto: aqui significa que a IA entendeu mal a pergunta, não que um gráfico fixo quebrou) e `FORBIDDEN_WORKSPACE_ACTION`. |
| **automations** | `/workspaces/:id/automation-rules` (GET/POST/PATCH/DELETE) | Regras "quando X, então Y" que rodam sem confirmação; toda a API é `OWNER`/`ADMIN` (`canManageAutomations`), então o item "Automações" da sidebar nem aparece para os demais. Ver [subseção dedicada](#automações) abaixo. |
| **developers** | `/workspaces/:id/api-keys`, `/api-keys/:id/rotate`, `/workspaces/:id/webhook-endpoints`, `/webhook-endpoints/:id/{rotate-secret,ping}`, `/webhook-endpoints/:id/deliveries` | Chaves de API + webhooks do workspace, exclusivo de `OWNER`/`ADMIN` (`canManageDeveloperPlatform`). Três seções empilhadas na própria página (não abas): Chaves de API, Webhooks e Documentação da API (referência técnica). Ver [subseção dedicada](#plataforma-de-api-chaves-e-webhooks) abaixo. |
| **assistant** | `/assistant/chat`, `/assistant/actions/:id/confirm`, `/assistant/actions/:id/cancel` | Chat de IA com ações — ver [subseção dedicada](#assistente-de-ia-com-ações) abaixo. |
| **admin** | `/admin/clients`, `/suspend`, `/activate` (DELETE = encerrar), `/admin/clients/:id`, `/admin/ai-usage/users/:id` | Gestão de contas da plataforma, exclusiva de `SUPER_ADMIN`; ver [§6](#6-autorização-e-papéis) para como o acesso é inferido. `/admin/clients/[clientId]` (dados básicos + atribuição de plano + histórico de uso de IA) reaproveita `AiUsageHistory` (ver **plans** abaixo) apontada para o endpoint admin em vez de `/ai-usage/me`. |
| **plans** | `GET /plans`, `PATCH /plans/me`, `GET/POST /admin/plans`, `PATCH /admin/plans/:id`, `PATCH /admin/users/:id/plan` | Teto de tokens de IA por usuário/mês (`monthlyTokenBudget`; tetos diário/semanal são derivados no backend, não expostos aqui). `/settings/plan` lista os planos e troca o próprio (`PlanPicker`); **nenhum endpoint devolve o `planId` atual do usuário** (confirmado contra `GetCurrentUserUseCase`/`ClientDetailDto` no backend — não é lacuna da doc), então a tela avisa explicitamente em vez de fingir saber qual plano já está ativo. `/admin/plans` é CRUD de planos (`name` só na criação — chave estável, não editável depois); atribuir/corrigir o plano de um cliente específico fica na página de detalhe do cliente (`AssignClientPlanCard`), pelo mesmo motivo (sem leitura do plano atual para pré-selecionar). `AiUsageHistory` (`features/assistant/components/`) aceita um hook `useUsageQuery` injetável para ser reaproveitado tanto em `/settings/plan`/`/settings/ai-usage` (`/ai-usage/me`) quanto na tela admin (`/admin/ai-usage/users/:id`), evitando duplicar o JSX. O explicador rico (cálculo dos tetos, janelas UTC, o que acontece ao estourar o limite) não vive numa aba dentro de `/settings/plan`/`/admin/plans` — fica no guia "Plano e uso de IA" de `/tutorial` (ver [Tutorial](#tutorial)), com um link "Saiba mais" (`TutorialGuideLink`) visível direto na tela, não escondido atrás de outro clique. |
| **sync** | `/sync/push`, `/sync/pull` | Ver [§10](#10-sincronização-offline). |
| **realtime** | `/workspaces/:id/realtime/ticket` (POST), `/realtime/stream?ticket=` (SSE) | Sinais de invalidação em tempo real — ver [Tempo real](#tempo-real-sse). |
| **tutorial** | — (sem API) | Página `/tutorial` + tour guiado — ver [Tutorial](#tutorial). |

### Quadro Kanban (`features/tasks/components/task-board.tsx` + `section-column.tsx`)

- Duas visualizações alternáveis e persistidas em `localStorage` (`useTaskViewMode`): lista compacta (`TaskLineItem`) ou cartões (`TaskCardItem`).
- **Drag-and-drop nativo do HTML5** (sem lib externa) — `src/lib/dnd.ts` define os MIME types customizados (`application/x-taskflow-task`, `application/x-taskflow-section`) que permitem a uma coluna distinguir "uma tarefa foi solta aqui" de "outra coluna foi solta aqui", já que `dragover` só expõe `dataTransfer.types` (não o payload) durante o arrasto. `setLiftedDragImage` aplica um efeito visual de "elevação" (leve rotação/sombra) diretamente ao elemento sendo arrastado antes de tirar o snapshot do navegador para a imagem de arrasto.
- `useTaskDropTarget` / `useSectionDropTarget`: hooks reutilizáveis que decidem se o item solto entra acima/abaixo (tarefas) ou à esquerda/direita (seções) do alvo, com base na posição do cursor dentro do bounding box do elemento.
- Colunas são redimensionáveis por arrasto (Pointer Events + `setPointerCapture`, para não perder eventos se o cursor sair da alça de 12px durante um arrasto rápido); a largura é persistida por seção em `localStorage`.
- Reordenar/mover tarefas entre colunas passa por `useMoveTaskToSectionMutation`, que aceita `position` explícito para inserir entre vizinhos específicos, não só no fim da lista.
- **Seleção múltipla** (`TaskSelectionProvider`, em `features/tasks/context/`): montado no `TaskBoard` e na página de coluna própria, guarda *snapshots* das tarefas marcadas (checkbox no cartão e na linha da tabela, "selecionar todas" no cabeçalho da coluna/tabela; com algo marcado, clicar num cartão alterna a seleção em vez de abrir a tarefa). A `TaskSelectionBar` flutuante move as marcadas para outra coluna (`useMoveTasksToSectionMutation`) ou as apaga (`useDeleteTasksMutation`). Arrastar uma tarefa marcada arrasta a seleção toda, com a mesma regra de "só entre colunas do mesmo nível" aplicada ao grupo (tudo ou nada). Mover e apagar usam as rotas em massa do backend (`PATCH /tasks/bulk`, `POST /tasks/bulk-delete`, até 100 itens por chamada — `tasksService` divide lotes maiores em chamadas sequenciais e reindexa os resultados). Elas respondem sempre `200` com sucesso parcial e sem rollback: cada item traz `SUCCESS`/`FAILED`, e as tarefas que falharam continuam marcadas. Apagar leva as subtarefas junto (`deletedSubtaskIds`) e trata `TASK_NOT_FOUND` como sucesso (a subtarefa pode já ter sumido em cascata). Criar em massa (`POST /projects/:id/tasks/bulk`) existe como `useBulkCreateTasksMutation`, ainda sem tela que o use. Offline, mover e apagar caem na fila do sync, uma operação por tarefa.

### Hierarquia (projetos, seções e comentários)

A API devolve as três hierarquias como **lista plana com `parentId`**; `src/lib/tree.ts` (`buildTree`, `collectDescendantIds`, `getAncestors`, `flattenTree`) reconstrói a árvore no cliente a partir do cache já carregado. Um item cujo pai não está na lista (filtrado ou fora da página) vira raiz em vez de sumir.

- **Projetos** — `ProjectTree` (colapsável, começa aberta) na página `/projects`; "Criar sub-projeto" reaproveita `CreateProjectDialog` com o pai fixo; mover é uma ação separada (`PATCH /projects/:id/move`, online-only — não existe operação de reparent no motor de sync). `ParentPickerDialog` (compartilhado com seções) desabilita o próprio item, seus descendentes e projetos arquivados, calculados da árvore em cache, antes de o usuário escolher. Breadcrumb só em sub-projetos. `PROJECT_HAS_CHILDREN` (409) tem mensagem própria.
- **Comentários** — `CommentNode` renderiza a thread recursivamente; a indentação visual para no nível 3 (`MAX_INDENT_LEVEL`), a profundidade dos dados é ilimitada. O botão de apagar fica desabilitado enquanto há respostas.
- **Seções (protótipo, a validar com uso real)** — só seções raiz são colunas do quadro; as subseções aparecem como accordion vertical dentro da coluna do pai (`SectionColumn` com `variant="nested"`, recursivo), atrás de "+N subseções". Tarefas só se movem por arrasto entre seções **com o mesmo pai**; entre níveis, pelo seletor de seção da tarefa (que lista o caminho "Pai / Filha"). Cada seção marca a própria drop zone com `data-section-drop` porque os eventos de arrasto de uma subseção sobem pelo DOM até o pai. Fora desta rodada, de propósito: arrastar seção inteira e arrastar entre níveis.

### Painel de detalhe de tarefa

`TaskDetailView` é compartilhado entre a página cheia (`/tasks/[taskId]`) e um `Sheet` lateral (`TaskDetailSheet`, montado no layout do projeto e controlado por `?taskId=` na URL via `useTaskPanel` — sobrevive a refresh e é compartilhável, ao estilo do painel de tarefa do Asana). Agrega: título/descrição, subtarefas, anexos, seção/status/responsável/prazo/prioridade (cada um com seu próprio seletor e sua própria mutação), campos personalizados, comentários e histórico de atividade — sempre nessa ordem, com comentários e atividade sempre por último independente do `layout` (`grid` na página cheia, `stacked` no painel).

### Assistente de IA com ações

Chat de IA (`features/assistant/`) acessível de qualquer tela via ícone fixo na topbar (`AssistantChat`), aberto como `Sheet` — mesmo padrão de painel lateral do `TaskDetailSheet`. Desligado por padrão em todo workspace (ver linha `assistantEnabled` acima); a `AssistantChat` checa `useCurrentWorkspace().workspace.assistantEnabled` e desabilita o input com uma nota explicativa em vez de tentar enviar mensagens.

- **Estado 100% efêmero, fora do TanStack Query**: o histórico da conversa e a lista de ações confirmadas vivem num `useReducer` dentro do próprio `AssistantChat` (`{ transcript: ChatTranscriptMessage[], confirmedActions: ConfirmedActionSummary[] }`) — não há persistência em `localStorage` nem no backend (stateless nesta v1 da API); os hooks (`use-assistant.ts`) só envolvem as três chamadas HTTP e seus efeitos colaterais, nunca guardam a conversa. **`AssistantChat` nunca desmonta** (renderizado incondicionalmente pela topbar, só o `Sheet` abre/fecha) — por isso o reset é explícito: `handleOpenChange` dispara `dispatch({ type: "reset" })` sempre que o `Sheet` fecha, não algo que aconteceria sozinho por desmontagem.
- **`PendingAction`**: toda tool de escrita vira uma ação pendente com `riskLevel: "standard" | "critical"` — nunca executa dentro de `POST /assistant/chat` (`executedActions` sempre vem vazio nesta versão, renderizado defensivamente para estabilidade de contrato). `PendingActionCard` sempre mostra `humanDescription` **e** `params` (via `PendingActionDetails`, componente compartilhado — nunca só a frase gerada pela IA) e exige um clique explícito em "Confirmar"/"Cancelar" — nunca uma mensagem de chat é interpretada como confirmação, essa é a regra de segurança central do componente.
- **Reautenticação para ações `critical`** (`delete_workspace`, `remove_workspace_member`, `archive_project`, `revoke_session`): confirmar abre `ReauthDialog`, um modal **bloqueante** (não um passo inline no card — `onInteractOutside`/`onEscapeKeyDown` desabilitados, só fecha pelos botões "Confirmar"/"Cancelar" do próprio modal) que repete `humanDescription`/`params`. O campo mostrado depende de `hasPassword`/`googleLinked` (`GET /auth/me`, via `useCurrentUserQuery`): senha quando `hasPassword`, botão "Confirmar com Google" quando `googleLinked` (Google Identity Services, `google.accounts.id.renderButton`, mesma `NEXT_PUBLIC_GOOGLE_CLIENT_ID`/script de `GoogleSignInButton`, ver `src/lib/google-identity.ts`), os dois quando ambos — nenhuma navegação para fora do modal nem troca de sessão, é só uma confirmação de identidade pontual (o ID Token nunca é persistido, só passa pela chamada). `POST /assistant/actions/:id/confirm` aceita `{ reauth: { password } }` ou `{ reauth: { googleIdToken } }` — a API ainda não aceita reautenticação por 2FA. "Cancelar" do modal só fecha a etapa de reautenticação (a `PendingAction` continua pendente); cancelar a ação em si continua sendo o botão "Cancelar" do card. Credencial inválida (senha errada, ou e-mail do Google não batendo com a conta vinculada) retorna `REAUTHENTICATION_REQUIRED` e o modal deixa tentar de novo sem fechar.
- **`revoke_session` da própria sessão** (`isCurrentSession: true` no `PendingAction`): ao confirmar com sucesso, `useConfirmPendingActionMutation` limpa a sessão local (`clearSession`) e redireciona para `/login` — sem chamar `sessionsService.revoke` de novo, já que o backend já revogou a sessão dentro do próprio `confirm`.
- **Invalidação de cache mapeada tool → chaves, explicitamente** (`applyConfirmedActionEffects` em `use-assistant.ts`) — cada tool de escrita (`create_task`, `archive_project`, `remove_workspace_member`, etc.) tem seu próprio `case` que decide `setQueryData`/`invalidateQueries`, sem fallback genérico "invalida tudo". O `result` de cada tool confirmada é o mesmo DTO que o endpoint REST equivalente devolveria (o backend chama o mesmo Use Case), então os `case`s fazem cast direto para `Task`/`Project`/etc.
- **Contador + resumo de sessão**: o cabeçalho do `Sheet` mostra "N ações confirmadas nesta conversa" e um botão "Encerrar e revisar" (habilitado só com `N > 0`) — clicar substitui a lista de mensagens por `AssistantSessionSummary` (tool em label passado, `humanDescription`, horário) antes de fechar de verdade; nada disso chama o backend, é só o `confirmedActions` já acumulado no reducer a cada `PendingAction` confirmada.
- **Kill switch do backend**: 3+ sinais de conteúdo suspeito ou 3+ falhas de reautenticação em 10 min desligam o assistente automaticamente para o workspace (mesmo efeito de um `OWNER` desligar manualmente) — o frontend não precisa tratar isso como um caso especial, só reflete `assistantEnabled: false` na próxima leitura do workspace.

### Automações

`features/automations/` — página própria `/automations` (`AutomationsSection`), item de sidebar visível só com `canManageAutomations` (`OWNER`/`ADMIN`). Sem regras, a **galeria de templates** ocupa a tela (`AutomationTemplatesGallery`, 4 exemplos em `lib/automation-templates.ts`, limitados ao que a whitelist do backend consegue expressar — "quando a task for criada" não é gatilho); com regras, a lista (`AutomationRuleList`) ocupa a tela e a galeria fica atrás de "Nova a partir de um template". Escolher um template abre o formulário já preenchido, faltando só os valores do próprio workspace (qual seção/projeto), destacados em âmbar.

- **Construtor em frase, não dropdowns empilhados** (`AutomationSentenceBuilder`): "Quando [uma tarefa] [tiver o status alterado] e [o novo status] [for] [Concluída], então [mover a tarefa] para a seção [Concluída]." Cada colchete é um campo inline (`InlineChip` + `Popover` + `Command` do shadcn — `cmdk` foi adicionada como dependência para isso —, com busca quando há mais de 6 opções, `SEARCH_THRESHOLD`). `lib/automation-catalog.ts` é a **cópia frontend** da whitelist do backend (eventos, campos de payload, ações `automatable`) porque não existe endpoint que a liste: um evento/ação novo no backend precisa ser adicionado aqui à mão (o backend valida ao salvar, então o descompasso falha com `INVALID_AUTOMATION_*`, nunca em silêncio).
- **`RuleDraft`** (`lib/automation-draft.ts`) é a forma editável (tudo string), convertida de/para a API só nas bordas (`fromRule` / `toRequest`). Trocar entidade/evento/ação descarta o que deixou de existir (`withEntity`/`withEvent`/`withTool`). O `taskId` da ação nunca é perguntado: sai do gatilho (`{{payload.entityId}}` em eventos de task, `{{payload.taskId}}` em comentário); eventos sem task só oferecem `create_task`. Parâmetros que o editor não conhece (ex.: `position` do `move_task`) são preservados em `extraParams` e avisados na tela, nunca descartados ao editar. Condições usam o tipo `AnalyticsFilter` e os mesmos operadores de analytics, mas não há componente de filtro de analytics para reaproveitar (os gráficos montam a query em código) — `TriggerConditionPicker` é o único seletor de filtro do app.
- **"Valor do evento" atrás de uma segunda aba** dentro do campo do parâmetro (`ParamValueField`): o padrão é "Valor fixo"; o placeholder `{{payload.CAMPO}}` só nasce ao escolher um campo do evento numa lista compatível com o tipo do parâmetro — ninguém digita a sintaxe.
- **Preview ao vivo** (`AutomationLivePreview`, fixo no topo do diálogo) mostra a frase completa a cada mudança; a mesma função (`describeDraft`) alimenta a lista de regras e o nome automático (nome em branco = a própria frase, cortada em 120).
- **Nomes reais em vez de ids** (`useAutomationLookups`): seções não têm endpoint por workspace, então busca as seções de cada projeto (mesma `queryKey` do quadro — projeto já aberto vem do cache) e resolve projetos/membros pelo cache existente.
- **Ainda não implementado** (o backend não expõe): teste/dry-run (`POST …/:id/test`), histórico de execuções (`GET …/activity?automationRuleId=`; hoje as entradas só trazem `triggeredByAutomationRuleId`, sem filtro) e `disabledReason`. Enquanto isso, a linha "Desativada" lista as causas possíveis num tooltip em vez de afirmar uma; religar é um `PATCH { enabled: true }` direto.

### Plataforma de API (chaves e webhooks)

`features/developers/` — página própria `/developers` (`DevelopersSection`), item de sidebar visível só com `canManageDeveloperPlatform` (`OWNER`/`ADMIN`; a API nega até listagem para os demais). Três seções empilhadas na página (`Card`s, não abas): Chaves de API (`ApiKeysPanel`), Webhooks (`WebhooksPanel`) e Documentação da API (`ApiReferenceSection`).

- **Chaves de API** (`ApiKeysPanel`/`api-key-list.tsx`/`api-key-form-dialog.tsx`): credencial de máquina sem usuário dono (`tfk_live_…`/`tfk_test_…`), com escopos de uma whitelist fechada (`ApiKeyScope` em `src/types/developer.ts` — `tasks:read/write`, `projects:read/write`, `workspace:read`, `webhooks:manage`) espelhada à mão no frontend, já que não existe endpoint que a liste. O `plainKey` completo só aparece uma vez, na criação/rotação (`useRotateApiKeyMutation`) — depois disso só o `keyPrefix` mascarado. Revogar é definitivo, sem "reativar".
- **Importante, e destacado na própria UI**: uma chave de API criada aqui já autentica chamadas normais da API (`GET /tasks`, etc.) via `Authorization: Bearer <chave>`, respeitando o escopo concedido — deixou de ser só a fundação da plataforma. Webhooks continuam entregando eventos de ponta a ponta, como antes.
- **Webhooks** (`WebhooksPanel`/`webhook-endpoint-list.tsx`/`webhook-endpoint-form-dialog.tsx`): endpoint HTTPS do workspace que recebe um `POST` assinado (`X-TaskFlow-Signature`, HMAC-SHA256 do corpo cru) a cada evento de uma whitelist fechada (`WEBHOOK_EVENTS` em `src/types/developer.ts`, mesmos identificadores de atividade/automações). `url` precisa ser `https://` e é validada contra SSRF no backend — `webhook-endpoint-list.tsx` mostra esse aviso antes de a chamada nem acontecer. Entrega tem retry automático (até 5 tentativas) e kill switch (10 falhas terminais seguidas desativa o endpoint sozinho); religar manualmente zera o contador. `WebhookDeliveriesSheet` lista o histórico de entregas de um endpoint (`GET …/deliveries`), com "reenviar" (`POST …/:id/redeliver`) por entrega. Um botão de "ping" dispara um evento sintético pelo mesmo caminho de uma entrega real, para validar a URL/assinatura sem esperar um evento de verdade.
- **Documentação da API** (`ApiReferenceSection`): referência técnica de **todo o API.md**, não só a § 22 — parâmetros de cada endpoint, exemplos de request/response em JSON e `curl`, o exemplo de verificação de assinatura HMAC em Node e uma tabela única com todos os códigos de erro de negócio (`GENERAL_ERRORS`, espelhando a § 1.2 inteira). Renderizada como UI real (`Table`/`Accordion`/`Badge`, não uma string Markdown) a partir de dados estruturados: `lib/api-reference-data.ts` traz os tipos (`ApiEndpoint`/`ApiParam`/`ApiErrorCode`), a tabela de erros e as rotas de chaves de API/webhooks (§ 22, o único recurso que uma API key gerencia sobre si mesma); cada outro recurso (auth/sessões, workspaces, projetos/seções, tasks/campos/comentários, analytics/sync/atividade, tempo real/automações, assistente, planos/uso de IA) tem seu próprio arquivo em `lib/api-reference/`, importando esses tipos. A página abre com um índice (`TOC`) de âncoras para os grupos de rotas — a lista é longa (espelha boa parte do backend), mas cada endpoint some por trás de um accordion colapsado, então só os títulos ficam visíveis por padrão. Fora do ar de propósito: administração da plataforma (`/admin/clients`, role `SUPER_ADMIN`) — não é algo que quem gerencia chaves/webhooks de um workspace (`OWNER`/`ADMIN` normal) precisa ou deveria ver aqui. `lib/developer-catalog.ts` continua reaproveitado só para os catálogos de escopos/eventos (não duplicados à mão). Antes disso, um `DeveloperDocs` embutido na feature havia sido substituído por um guia em `/tutorial`, com o racional de que uma aba de documentação "enterra" a informação para o público leigo do app; esta referência aqui é diferente por natureza — conteúdo puramente técnico (JSON, `curl`, códigos HTTP) que só interessa a quem já está integrando nesta página gated a `OWNER`/`ADMIN`. O guia "Chaves de API e webhooks" de `/tutorial` continua existindo para a parte conceitual (pra que serve, quando ignorar, como usar a UI), linkado no topo da página (`TutorialGuideLink`, `/tutorial#developers`); os dois se complementam em vez de duplicar. O mesmo racional de manter o explicador conceitual fora da feature levou o guia "Plano e uso de IA" para `/tutorial` em vez de uma seção em `/settings/plan`/`/admin/plans` (ver **plans** na tabela acima) — essa decisão não muda, só a de referência técnica pura como esta.

### Tutorial

`features/tutorial/` — sem chamadas à API; todo o estado é local.

- **Página `/tutorial`**: 16 guias em 4 grupos (Comece por aqui, Trabalho do dia a dia, Recursos avançados, Conta e funcionamento), seguidos da matriz **Papéis e permissões** e de um **Glossário**. `TutorialGuides` é um accordion (`components/ui/accordion.tsx`, `type="multiple"`) com busca (ignora acentos; abre sozinha até 3 resultados), atalhos por guia e deep link por hash (`/tutorial#board` abre e rola até o guia).
- **`TutorialGuideLink`** (`components/shared/`): um link simples e sempre visível para `/tutorial#<guideId>`, usado por telas de feature (`DevelopersSection`, `/settings/plan`, `/admin/plans`) que precisam de documentação rica sem duplicá-la — em vez de embutir um explicador próprio numa aba interna da feature (que esconde a informação atrás de mais um clique, ruim para o público leigo a quem `/tutorial` é dirigido), a feature aponta para o guia certo.
- **Conteúdo é dado, não JSX** (`lib/tutorial-guides.ts`): cada guia tem `sections` (`intro`, `steps`, `bullets`, `callouts` dos tipos `tip`/`note`/`warning`), `faq`, `audience`, `related` e `href`. `GuideBody` renderiza tudo; adicionar ou editar um guia não exige mexer em componente. A busca indexa todo esse texto. `lib/tutorial-reference.ts` guarda a matriz de papéis (espelha `src/lib/permissions.ts` — atualizar os dois juntos) e o glossário.
- **Texto acompanha a interface**: os guias citam rótulos reais ("Novo projeto", "Mover para…", "Adicionar coluna", "Mais filtros") e chamam as seções do quadro de **colunas**, como a UI. Revisar quando o texto da interface mudar. O `AccordionContent` usa `h-auto` porque a primitiva fixa a altura medida na abertura, o que cortaria os `<details>` de dúvidas ao expandirem.
- **Tour guiado** (`TutorialTour`, montado no layout do dashboard): overlay com spotlight sobre elementos marcados com `data-tour="<id>"` (seletor de workspace, sidebar, botão do assistente, menu do usuário) e um cartão de passos. Sem biblioteca externa. Os passos ficam em `lib/tour-steps.ts` e miram só o shell (topbar/sidebar), então funciona igual em qualquer página. Passos cujo alvo não está visível quando o tour abre (sidebar no mobile ou recolhida) são descartados; passos sem `target` aparecem centralizados. Teclado: `Esc` sai, `←`/`→` navegam, e o foco fica preso no cartão. O overlay só monta enquanto aberto, para resolver os alvos contra o DOM daquele momento.
- **Persistência** (`context/tutorial-context.tsx`, `TutorialProvider`): `taskflow.tourSeen.<userId>` em `localStorage` (`completed` | `skipped`). Por usuário para que uma segunda conta no mesmo navegador também veja o tour; por navegador, como as demais preferências locais. Abre sozinho no primeiro acesso, depois que os workspaces carregam; sem `localStorage` disponível, não abre automaticamente (senão repetiria a cada carga). Pode ser refeito pelo menu do usuário ou pelo botão da página `/tutorial`.
- **Novo alvo de tour**: basta adicionar `data-tour="<id>"` ao elemento (o botão precisa repassar props ao DOM, como o `Button`) e um passo em `TOUR_STEPS`.

## 12. UI, design system e tema

- **shadcn/ui** (`components.json`, estilo `radix-nova`, cor base `neutral`, ícones `lucide`) gera os primitivos em `src/components/ui/` — não são editados manualmente fora de customizações pontuais; alterações de configuração passam pelo CLI `shadcn`.
- **Tokens de tema** em `src/app/globals.css`, definidos em OKLCH, com paletas separadas para claro/escuro (`:root` / `.dark`), aplicados via `next-themes` (`attribute="class"`, `defaultTheme="system"`). O componente `ThemeToggle` alterna entre os modos.
- **Gráficos**: `CategoryBarChart` (`features/analytics/components/category-bar-chart.tsx`) é um bar chart horizontal construído sobre Recharts via o wrapper `ChartContainer`/`ChartTooltip`/`ChartTooltipContent` do shadcn/ui (`src/components/ui/chart.tsx`). Cada barra recebe sua cor por linha via `<Cell fill={row.color}>` (não por série do `ChartConfig`, já que as categorias — projetos, responsáveis — são abertas e não fixas).
- **Paleta de gráficos**: `--chart-1..5` (tokens padrão do shadcn) **não** é usada em novos gráficos categóricos porque as duas primeiras cores falham em distinção segura para daltonismo (CVD) quando adjacentes. Uma paleta dedicada `--analytics-cat-1..6` (com valores próprios claro/escuro) é a referência validada usada por `AnalyticsDashboard`/`CategoryBarChart`.
- **`cn()`** (`src/lib/utils.ts`) é apenas um re-export do pacote `cn` (não a implementação local `clsx`+`tailwind-merge` mais comum em outros projetos shadcn) — usado em todo o código para compor classes condicionalmente.
- Componentes compartilhados de padrão de tela em `components/shared/`: `PageHeader`, `EmptyState`, `ErrorState` (mostra a mensagem já traduzida via `getErrorMessage` + botão "Tentar novamente"), `ConfirmDialog` (wrapper de `AlertDialog` para confirmações destrutivas), `Pager`, `RoleGate`, `StatusBadge.tsx` (badges tipados para todo enum de status do domínio: projeto, tarefa, prioridade, prazo, papel de workspace, convite, cliente), `MemberAvatar`/`MemberIdLabel` (avatar de iniciais + tooltip, já que a API não expõe nome/e-mail de membros — só `userId`).

## 13. Formulários e validação

Padrão único e consistente em todo o app: `react-hook-form` + `zodResolver` + os componentes `Form`/`FormField`/`FormItem`/`FormControl`/`FormMessage` do shadcn (wrappers sobre Radix). Schemas zod vivem em `schemas.ts` de cada feature (`features/auth/schemas.ts`, `features/tasks/schemas.ts`, etc.), exportando também o tipo inferido (`z.infer<typeof schema>`) usado como tipo genérico do `useForm`. Mensagens de validação já nascem em pt-BR nos próprios schemas.

## 14. Convenções de código

- **Vertical slice por domínio**: cada pasta em `features/` é dona de sua API, hooks, componentes e schemas — evita um `services/` ou `hooks/` monolítico compartilhado.
- **Um hook por operação de mutação**, nomeado pelo verbo (`useCreateXMutation`, `useUpdateXMutation`, `useArchiveXMutation`...), sempre com `onSuccess` (toast + invalidação) e `onError` (`toast.error(getErrorMessage(error))`) definidos no próprio hook — componentes não tratam erro de mutação manualmente.
- **Preferências puramente locais** (modo de visualização do quadro, largura de coluna, workspace selecionado) vivem em `localStorage` via hooks dedicados, nunca em query params nem sincronizadas com o servidor — documentado explicitamente nos comentários desses hooks.
- **Comentários no código** são usados com moderação e só para decisões não óbvias (por que um MIME type customizado, por que `setTimeout` em vez de `requestAnimationFrame`, por que um campo é opaco) — não para descrever o que o código faz.
- **`"use client"`** é declarado por arquivo conforme necessário; páginas que só compõem componentes client-only ainda assim costumam ser marcadas para deixar explícito o boundary.
- **Views com estado local precisam de `key={id}`** quando podem trocar de identidade sem desmontar: `TaskDetailView` (chave `taskId`, tanto na rota cheia quanto no `TaskDetailSheet`), `WorkspaceActivitySection` e `AnalyticsDashboard` (chave `workspaceId`) forçam remount ao trocar de tarefa/workspace. Sem isso, componentes React re-renderizam no lugar em vez de remontar quando só a prop de identidade muda — estado local (página de paginação, rascunho de formulário) vazaria de uma tarefa/workspace para o próximo em vez de resetar. Qualquer view nova com estado local (`useState`) escopado a um id — não só cache de query — precisa do mesmo tratamento.

## 15. Limitações conhecidas

Herdadas diretamente da API (não são bugs do frontend):

- **Sem endpoint de perfil do usuário autenticado** — nome/e-mail exibidos vêm da decodificação do próprio JWT (`decodeJwt`); não há como buscar dados de outro usuário além do `userId`.
- **Sem leitura do plano de tokens de IA atual de um usuário** — só é possível **atribuir** um plano (`PATCH /plans/me`, `PATCH /admin/users/:id/plan`), nunca ler de volta qual está ativo (nem em `GET /auth/me`, nem em `GET /admin/clients/:id`); `/settings/plan` e a atribuição em `/admin/clients/[clientId]` avisam isso na UI em vez de um fallback silencioso.
- **Membros de workspace/projeto expõem só `userId`** — sem nome ou e-mail, daí os avatares de iniciais + tooltip com id abreviado (`MemberAvatar`) em vez de nomes reais.
- **Sem exclusão de projeto ou tarefa** — apenas arquivamento (projeto) e mudança de status (tarefa).
- **`PATCH /tasks/:id` não consegue limpar `assigneeId`** — omitir o campo mantém o responsável atual; limpar exige ir por `/sync/push` mesmo online (`useUnassignTaskMutation`).
- **Prazo e prioridade de tarefa, uma vez definidos, só podem ser substituídos por outro valor** — a API não oferece uma forma de removê-los depois de definidos.
- **Comentários e valores de custom field em tarefas não são versionados** (`version`) — sem base para concorrência otimista; por isso ficam parcialmente ou totalmente fora do fluxo de sincronização offline (ver [§10](#10-sincronização-offline)).
- **Gráficos de dashboard não têm períodos relativos** ("últimos 30 dias", "atrasadas agora") — um filtro de data num gráfico salvo guarda um timestamp fixo, calculado no cliente na hora de salvar; "últimos 7 dias" viraria silenciosamente "7 dias antes de quando o gráfico foi criado". Por isso o construtor só oferece intervalos fixos, exibidos como datas, e para atraso usa a métrica `overdue_rate`, que o servidor calcula no momento da consulta. Destrava quando a API aceitar datas relativas resolvidas na consulta (algo como `"value": "now-7d"`) — pedido já levado ao backend.
- **Reautenticação de ações críticas do assistente só aceita senha** — a API já reserva o campo `twoFactorCode` no body, mas rejeita sempre; o frontend nunca oferece essa opção. **Histórico de conversa do assistente não é persistido** em lugar nenhum (nem servidor, nem `localStorage`) — fecha o painel, perde a conversa, por design.
