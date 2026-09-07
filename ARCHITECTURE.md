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

Features existentes: `auth`, `sessions`, `workspaces`, `projects`, `tasks`, `sections`, `custom-fields`, `comments`, `activity`, `analytics`, `admin`, `sync`.

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
  /workspaces                              Lista de workspaces do usuário
  /workspaces/[workspaceId]                Detalhe: membros / convites / atividade (tabs)
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
  /admin/clients                           Gestão de clientes (apenas SUPER_ADMIN)
```

### Guards

- **`RequireAuth`** (`features/auth/components/require-auth.tsx`): redireciona para `/login?next=<path>` se não autenticado; mostra spinner enquanto `isLoading`. Envolve todo o grupo `(dashboard)`.
- **`RequireGuest`** (`require-guest.tsx`): o inverso — usado em `/login` e `/register`; redireciona usuários já autenticados para `getSafeRedirectPath(next)`.
- **`/admin/clients`**: não tem guard próprio de rota — a proteção acontece via `useIsSuperAdminQuery` (ver [§6](#6-autorização-e-papéis)) e o item de navegação só aparece na sidebar se a query tiver sucesso; se o usuário acessar a URL diretamente sem ser super admin, `ClientsTable` detecta o 403 da API e redireciona para `/403`.

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

**Apenas edição/exclusão de entidades já existentes**: tarefa, projeto, seção e definição de custom field (edição), e exclusão de seção e comentário. **Criar** qualquer entidade nova permanece online-only — criar offline exigiria id gerado no cliente + renderização otimista de listas + reconciliação de id, uma feature maior e distinta. Valores de custom field em tarefas também ficam online-only: ao contrário de toda outra entidade do §13, não têm campo `version`, então não há `baseVersion` para chave de concorrência otimista.

### Peças do motor (`features/sync/`)

- **`lib/outbox.ts`** — fila persistida em `localStorage` (`taskflow.syncOutbox`). `enqueueOperation` funde uma segunda edição offline da mesma entidade na operação `UPDATE` já pendente (em vez de empilhar), evitando que a segunda operação carregue o mesmo `baseVersion` da primeira e gere um `CONFLICT` falso contra a versão que a própria primeira operação acabou de produzir no servidor.
- **`lib/device-id.ts`** — id estável por navegador (`crypto.randomUUID()`, persistido), enviado em toda `SyncOperation.deviceId`.
- **`lib/cursor.ts`** — cursor de pull por workspace (`taskflow.syncCursor.<id>`); ausente = "nunca puxado" (equivalente documentado a `since=0`).
- **`lib/sync-engine.ts`** — orquestra tudo:
  - `queueEntityUpdate` / `queueEntityDelete`: enfileiram uma operação e devolvem uma cópia otimista da entidade (para o `onSuccess` da mutação atualizar o cache como se fosse online).
  - `pushImmediate`: envia uma única operação via `/sync/push` mesmo estando online — usado exclusivamente para limpar `assigneeId` de uma tarefa, a única escrita que a superfície REST não consegue expressar (`PATCH /tasks/:id` nunca aceita `assigneeId: null`; omitir o campo mantém o responsável atual).
  - `flushOutbox`: agrupa operações pendentes por workspace, envia cada grupo, reconcilia o cache por resultado (`APPLIED`/`CONFLICT`/`REJECTED`/`DUPLICATE`) e remove do outbox só o que o servidor de fato respondeu — o que falhar por estar ainda offline permanece na fila.
  - `pullChanges`: pagina `/sync/pull` até `hasMore` ser falso; como o formato de uma mudança é opaco (`SyncChange = Record<string, unknown>`), qualquer pull não-vazio simplesmente invalida os grupos de query relevantes (tarefas, projetos, seções, custom fields, comentários) em vez de tentar mesclar campo a campo — os endpoints REST continuam sendo a fonte de verdade.
- **`context/sync-context.tsx`** (`SyncProvider`) — dispara `flushOutbox` + `pullChanges` sempre que o navegador fica online, e a cada 30s como rede de segurança caso o evento `online` não dispare (ex.: aba que nunca recebeu o evento). Expõe `{ isOnline, pendingCount, isSyncing, syncNow }` via `useSync()`.
- **`components/sync-status-indicator.tsx`** — ícone na topbar (nuvem cortada / spinner / refresh com badge de contagem) que também permite forçar sync manual.

### Como os hooks de domínio decidem online vs. offline

Cada mutação elegível (`useUpdateTaskMutation`, `useChangeTaskStatusMutation`, `useMoveTaskToSectionMutation`, `useUpdateSectionMutation`, `useDeleteSectionMutation`, `useUpdateProjectMutation`, `useArchiveProjectMutation`, `useUpdateCustomFieldOptionsMutation`, `useArchiveCustomFieldMutation`, `useDeleteCommentMutation`) segue o mesmo padrão: se `isOffline()` (checa `!navigator.onLine`) **e** há um workspace atual **e** a entidade já está em cache, chama `queueEntityUpdate`/`queueEntityDelete` em vez do service HTTP; senão, segue o caminho REST normal. O toast de sucesso também muda de texto ("salvo offline — será sincronizado...") para deixar claro ao usuário que a alteração ainda não chegou ao servidor.

## 11. Domínios de negócio (features)

| Feature | Endpoints principais | Observações |
|---|---|---|
| **auth** | `/auth/register`, `/verify-email`, `/login`, `/login/verify`, `/login/google` | 2FA por e-mail obrigatório no login por senha; Google pula o 2FA. |
| **sessions** | `/auth/sessions` | Lista/revoga sessões (dispositivos); `useLogout` revoga a sessão atual (best-effort) e sempre limpa o estado local mesmo se a chamada falhar. |
| **workspaces** | `/workspaces`, `/workspaces/:id`, `/members`, `/invitations` | CRUD + membros + convites; exclusão exige workspace vazio (só o `OWNER` sozinho) e papel `OWNER`. |
| **projects** | `/workspaces/:id/projects`, `/projects/:id`, `/archive`, `/members`, `/invitations` | Sem exclusão — só arquivamento (`ProjectStatus: ACTIVE \| ARCHIVED`). Papel de gestão herdado do workspace ([§6](#6-autorização-e-papéis)). |
| **sections** | `/projects/:id/sections`, `/sections/:id` | Colunas do quadro Kanban; uma seção "padrão" (`isDefault`) não pode ser apagada; exclusão exige seção vazia. |
| **tasks** | `/projects/:id/tasks`, `/tasks/:id`, `/tasks/:id/status`, `/tasks/:id/subtasks`, `/tasks/:id/attachments` | Entidade central. Suporta subtarefas (`parentTaskId`), anexos (upload multipart, limite de 20MB, download via blob), prioridade e prazo (uma vez definidos, só podem ser trocados por outro valor — não removidos pela API). |
| **custom-fields** | `/projects/:id/custom-fields`, `/custom-fields/:id/options`, `/archive`, `/tasks/:id/custom-field-values` | Tipos: `TEXT`, `NUMBER`, `DATE`, `SINGLE_SELECT`, `MULTI_SELECT`, `CHECKBOX`, `PEOPLE`. Arquivamento em vez de exclusão. |
| **comments** | `/tasks/:id/comments`, `/comments/:id` | Sem `version` (não versionado) — exclusão offline sempre reaplica ao sincronizar. Autor só pode apagar os próprios comentários (validado no servidor). |
| **activity** | `/workspaces/:id/activity`, `/tasks/:id/activity` | Feed de auditoria paginado (genuinamente ilimitado — cresce a cada edição de status/responsável/movimentação). |
| **analytics** | `/analytics/query` (POST) | Query builder genérico: `entity` (`tasks`\|`projects`) + `filters` + `groupBy` + `metrics`. Hooks especializados (`use-analytics.ts`) montam queries prontas (contagem total, por status, por responsável, por projeto) para alimentar `AnalyticsDashboard`. |
| **admin** | `/admin/clients`, `/suspend`, `/activate` (DELETE = encerrar) | Gestão de contas da plataforma, exclusiva de `SUPER_ADMIN`; ver [§6](#6-autorização-e-papéis) para como o acesso é inferido. |
| **sync** | `/sync/push`, `/sync/pull` | Ver [§10](#10-sincronização-offline). |

### Quadro Kanban (`features/tasks/components/task-board.tsx` + `section-column.tsx`)

- Duas visualizações alternáveis e persistidas em `localStorage` (`useTaskViewMode`): lista compacta (`TaskLineItem`) ou cartões (`TaskCardItem`).
- **Drag-and-drop nativo do HTML5** (sem lib externa) — `src/lib/dnd.ts` define os MIME types customizados (`application/x-taskflow-task`, `application/x-taskflow-section`) que permitem a uma coluna distinguir "uma tarefa foi solta aqui" de "outra coluna foi solta aqui", já que `dragover` só expõe `dataTransfer.types` (não o payload) durante o arrasto. `setLiftedDragImage` aplica um efeito visual de "elevação" (leve rotação/sombra) diretamente ao elemento sendo arrastado antes de tirar o snapshot do navegador para a imagem de arrasto.
- `useTaskDropTarget` / `useSectionDropTarget`: hooks reutilizáveis que decidem se o item solto entra acima/abaixo (tarefas) ou à esquerda/direita (seções) do alvo, com base na posição do cursor dentro do bounding box do elemento.
- Colunas são redimensionáveis por arrasto (Pointer Events + `setPointerCapture`, para não perder eventos se o cursor sair da alça de 12px durante um arrasto rápido); a largura é persistida por seção em `localStorage`.
- Reordenar/mover tarefas entre colunas passa por `useMoveTaskToSectionMutation`, que aceita `position` explícito para inserir entre vizinhos específicos, não só no fim da lista.

### Painel de detalhe de tarefa

`TaskDetailView` é compartilhado entre a página cheia (`/tasks/[taskId]`) e um `Sheet` lateral (`TaskDetailSheet`, montado no layout do projeto e controlado por `?taskId=` na URL via `useTaskPanel` — sobrevive a refresh e é compartilhável, ao estilo do painel de tarefa do Asana). Agrega: título/descrição, subtarefas, anexos, seção/status/responsável/prazo/prioridade (cada um com seu próprio seletor e sua própria mutação), campos personalizados, comentários e histórico de atividade — sempre nessa ordem, com comentários e atividade sempre por último independente do `layout` (`grid` na página cheia, `stacked` no painel).

## 12. UI, design system e tema

- **shadcn/ui** (`components.json`, estilo `radix-nova`, cor base `neutral`, ícones `lucide`) gera os primitivos em `src/components/ui/` — não são editados manualmente fora de customizações pontuais; alterações de configuração passam pelo CLI `shadcn`.
- **Tokens de tema** em `src/app/globals.css`, definidos em OKLCH, com paletas separadas para claro/escuro (`:root` / `.dark`), aplicados via `next-themes` (`attribute="class"`, `defaultTheme="system"`). O componente `ThemeToggle` alterna entre os modos.
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

## 15. Limitações conhecidas

Herdadas diretamente da API (não são bugs do frontend):

- **Sem endpoint de perfil do usuário autenticado** — nome/e-mail exibidos vêm da decodificação do próprio JWT (`decodeJwt`); não há como buscar dados de outro usuário além do `userId`.
- **Membros de workspace/projeto expõem só `userId`** — sem nome ou e-mail, daí os avatares de iniciais + tooltip com id abreviado (`MemberAvatar`) em vez de nomes reais.
- **Sem exclusão de projeto ou tarefa** — apenas arquivamento (projeto) e mudança de status (tarefa).
- **`PATCH /tasks/:id` não consegue limpar `assigneeId`** — omitir o campo mantém o responsável atual; limpar exige ir por `/sync/push` mesmo online (`useUnassignTaskMutation`).
- **Prazo e prioridade de tarefa, uma vez definidos, só podem ser substituídos por outro valor** — a API não oferece uma forma de removê-los depois de definidos.
- **Comentários e valores de custom field em tarefas não são versionados** (`version`) — sem base para concorrência otimista; por isso ficam parcialmente ou totalmente fora do fluxo de sincronização offline (ver [§10](#10-sincronização-offline)).
