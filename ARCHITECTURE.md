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

Features existentes: `activity`, `admin`, `analytics`, `approvals`, `assistant`, `assistant-channels`, `auth`, `automations`, `comments`, `custom-fields`, `dashboard-pages`, `data-portability`, `developers`, `folder-stats`, `folder-templates`, `folders`, `home`, `intake-forms`, `items`, `notifications`, `plans`, `realtime`, `recurring-items`, `search`, `sections`, `sessions`, `sync`, `time-tracking`, `tutorial`, `workspaces`.

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
- **Hooks concentram toda a lógica de cache**: `queryKey`, invalidação após mutação, toasts de sucesso/erro, e — em várias mutações de `items`/`sections`/`folders`/`custom-fields`/`comments` — o desvio para a fila offline quando `navigator.onLine` é falso (ver [§10](#10-sincronização-offline)).
- **Tipos em `src/types`** espelham os DTOs documentados no `API.md` do backend; cada arquivo (`item.ts`, `folder.ts`, `workspace.ts`...) tem as interfaces de entidade + request/response de cada operação.

## 4. Roteamento (App Router)

### Árvore de rotas

```
/                                          Landing page (marketing, público)
/login                                     Login (e-mail/senha) — RequireGuest
/login/verify                              2º fator (código de e-mail)
/register                                  Cadastro — RequireGuest
/verify-email                              Confirmação de e-mail pós-cadastro
/forgot-password                           Pedir o link de redefinição de senha
/reset-password                            Definir a nova senha pelo link do e-mail
/privacy                                   Política de privacidade (estática)
/403                                       Acesso negado (estático)
/invite/workspace/[token]                  Preview + aceite de convite de workspace (público, aceite exige login)
/invite/folder/[token]                    Preview + aceite de convite de pasta (idem; os dois usam `InvitationAcceptPage`)

(dashboard)/                               Layout protegido — RequireAuth + CurrentWorkspaceProvider + SyncProvider
  /home                                    Início (destino padrão pós-login): saudação, números dos itens atribuídos a mim no workspace atual, itens em aberto por pasta, pastas recentes e atalhos; sem workspace, oferece criar um
  /dashboard                               Redirect para /home (rota antiga)
  /workspaces                              Lista de workspaces do usuário; clicar num card o define como workspace atual; abaixo, seções empilhadas do workspace atual: membros, convites, assistente e atividade
  /workspaces/[workspaceId]                Detalhe: apenas membros + convites, como duas seções empilhadas (sem tabs)
  /workspaces/[workspaceId]/pages          Páginas de dashboard do workspace (item "Páginas" da sidebar)
  /workspaces/[workspaceId]/pages/[pageId] Editor de uma página de dashboard (gráficos em grade, largura total)
  /activity                                Redirect para /workspaces#atividade (a atividade virou seção de /workspaces e aba da pasta)
  /developers                              Chaves de API + webhooks do workspace atual (item da sidebar só para OWNER/ADMIN; a própria página também bloqueia acesso direto por URL)
  /assistant                               Liga/desliga o assistente de IA do workspace atual (toggle só para OWNER; página visível a todos) + histórico de consumo de IA da conta (`AiUsageHistory` sobre GET /ai-usage/me), em seções empilhadas
  /folders                                Todas as pastas do workspace (ativos + arquivados); sem workspace, oferece criar um; "Começar de um modelo" leva a /templates
  /folders/[folderId]/(folder)/            Grupo de rotas com o layout da pasta: header, tabs, ItemDetailSheet global
    (index)                                Redirect → /items
    /items                                 Quadro Kanban (ItemBoard)
    /items/[itemId]                        Página cheia de detalhe do item
    /stats                                 Estatísticas da pasta (números + gráficos, subpastas somadas; aba para todo membro)
    /members                               Membros da pasta
    /invitations                           Convites da pasta
    /custom-fields                         Campos personalizados da pasta
    /activity                              Atividade da pasta (linha do tempo paginada, GET /folders/:id/activity)
    /automations                           Automações que agem nesta pasta (aba só para OWNER/ADMIN do workspace)
    /timeline                              Cronograma (Gantt): itens com datas + setas de dependência (GET /folders/:id/timeline)
    /recurring                             Itens repetidos da pasta (/folders/:id/recurring-items)
    /trash                                 Lixeira da pasta (30 dias) com restaurar
    /settings                              Configurações da pasta em seções empilhadas: etapas, regra de dependências, formulários de pedidos, importar/exportar
  /folders/[folderId]/sections/[sectionId] Uma coluna sozinha numa página, fora do grupo (folder): sem header nem tabs da pasta
  /templates                               Modelos, em duas seções empilhadas: os do workspace atual (privados) e os do sistema (busca + filtro de categoria na query string)
  /templates/[templateId]                  Detalhe do modelo: prévia, usar; editar/excluir para OWNER/ADMIN quando é modelo do workspace
  /settings/profile                        Foto de perfil + segurança (#seguranca: alterar senha / definir primeira senha em conta Google-only / vincular Google em conta com senha) + sessões ativas (#sessoes), em seções empilhadas
  /settings/security                       Redirect para /settings/profile#seguranca
  /settings/sessions                       Redirect para /settings/profile#sessoes
  /settings/notifications                  Preferências de notificação por tipo (no app / e-mail)
  /settings/plan                           Plano atual com preço e desconto (GET /plans/me), troca de plano com cupom (PATCH /plans/me) + consumo de hoje/semana/mês (UTC) + histórico de consumo
  /tutorial                                Guias por tema (accordion) + botão para refazer o tour guiado
  /admin/clients                           Gestão de clientes (apenas SUPER_ADMIN)
  /admin/clients/[clientId]                Detalhe do cliente: dados básicos, atribuição de plano, histórico de uso de IA (apenas SUPER_ADMIN)
  /admin/plans                             CRUD de planos de tokens de IA — criar, editar teto, listar (apenas SUPER_ADMIN)
  /admin/templates                         Modelos do sistema: listar e excluir (apenas SUPER_ADMIN; o backend não tem mais situação nem moderação)
  /admin/coupons                           Cupons de desconto dos planos pagos: criar, editar, desativar, ver resgates (apenas SUPER_ADMIN)

/forms/[token]                             Formulário de pedidos público (sem login, sem o shell do app) — cada envio vira um item
/pages/public/[token]                      Página de dashboard publicada por link (sem login)
/pages/guest/[token]                       Página de dashboard compartilhada com um convidado por e-mail (link próprio)
```

### Guards

- **`RequireAuth`** (`features/auth/components/require-auth.tsx`): redireciona para `/login?next=<path>` se não autenticado; mostra spinner enquanto `isLoading`. Envolve todo o grupo `(dashboard)`.
- **`RequireGuest`** (`require-guest.tsx`): o inverso — usado em `/login` e `/register`; redireciona usuários já autenticados para `getSafeRedirectPath(next)`.
- **`/admin/clients`**: não tem guard próprio de rota — a proteção acontece via `useIsSuperAdminQuery` (ver [§6](#6-autorização-e-papéis)) e o item de navegação só aparece na sidebar se a query tiver sucesso; se o usuário acessar a URL diretamente sem ser super admin, `ClientsTable` detecta o 403 da API e redireciona para `/403`.
- **`/admin/plans`**, **`/admin/templates`** e **`/admin/clients/[clientId]`**: mesmo padrão — sem `useIsSuperAdminQuery` própria, cada página detecta o 403 do próprio endpoint que já usa (`GET /admin/plans`, `GET /admin/folder-templates`, `GET /admin/clients/:id` — todos SUPER_ADMIN-only) e redireciona para `/403`. `useAdminFolderTemplatesQuery` usa `retry: false` para o redirecionamento não esperar uma segunda tentativa.
- **Usar um modelo** (`/templates/[templateId]`): a página é aberta a todos, mas o botão "Usar este modelo" fica desabilitado, com explicação, se o papel no workspace atual não passar em `canInstantiateFolderTemplate` (OWNER/ADMIN). "Salvar como modelo", no header da pasta, fica dentro do mesmo `RoleGate` (`canManageWorkspace` no workspace da pasta) das outras ações de gestão.
- **`/developers`**: o item de sidebar já filtra por `workspacePermission` (`nav-items.ts`, avaliado contra o papel do usuário no workspace atual), mas isso só esconde o link — quem acessa a URL direto sem ser OWNER/ADMIN vê um `EmptyState` de "Acesso restrito" renderizado pela própria página, sem round-trip à API (a checagem usa o mesmo `workspace.members` já carregado por `useCurrentWorkspace`).

### Padrões notáveis de rota

- **`folders/[folderId]/(folder)/layout.tsx`** (grupo de rotas `(folder)`; a página de coluna `sections/[sectionId]` fica fora dele, sem header nem tabs) carrega a pasta uma vez (`useFolderQuery`) e renderiza header/tabs/ações (editar, arquivar) para todas as sub-rotas; também monta `<ItemDetailSheet>`, um painel lateral global controlado por query string (`?itemId=`, via `useItemPanel`) que funciona em qualquer página aninhada da pasta — permite abrir um item em painel sem navegar para fora do quadro.
- **`FolderIndexPage`** (`/folders/[folderId]`) é um Server Component só com `redirect()` para `/items` — não há dashboard próprio de pasta.
- Páginas dinâmicas usam `use(props.params)` (API do React 19) para desembrulhar `params` em Client Components, tipados por `PageProps<"/rota">`. As páginas de dashboard (`workspaces/[workspaceId]/pages/*`, `pages/*/[token]`) leem com `useParams()` — funciona, mas prefira o padrão acima em página nova.

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

Expõe `{ isLoading, isAuthenticated, userId, email, signOut }`. `userId`/`email` vêm da decodificação client-side do JWT (`decodeJwt`, base64url manual — sem lib), disponíveis antes de qualquer request. O perfil (nome, foto, `hasPassword`, `googleLinked`) vem de `GET /auth/me` (`useCurrentUserQuery`, e `useSelfIdentity` para nome/iniciais/rótulo de exibição).

## 6. Autorização e papéis

Modelo de papéis (`src/types/workspace.ts`, `src/types/folder.ts`):

- **Workspace**: `OWNER` > `ADMIN` > `MEMBER` > `GUEST`.
- **Pasta**: apenas `MEMBER` / `GUEST` — **não existe papel elevado no nível de pasta**. Toda ação de gestão de pasta (editar, arquivar, gerenciar membros/convites/custom fields) é autorizada pelo papel do usuário no **workspace pai**, não na pasta.

`src/lib/permissions.ts` centraliza essa lógica em funções puras (`canManageWorkspace`, `canDeleteWorkspace` — exige `OWNER` especificamente, `canInviteWorkspaceMembers`, `canManageFolderMembers`, `canManageCustomFields`, `canArchiveFolder`, `isLastOwner`). `features/folders/hooks/use-folder-permission.ts` busca o workspace da pasta e aplica `canManageWorkspace` ao papel do usuário nele.

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

- Chaves de listas paginadas (`items.all`, `workspaces.invitations`, `folders.invitations`, `items.bySection`, `activity.*`, `comments.all`) só incluem `{ page }` quando a página é relevante para a invalidação; omitir a página faz `invalidateQueries` casar como prefixo e invalidar todas as páginas de uma vez.
- `items.bySectionAll()` é um prefixo deliberadamente "solto" (`["items", "section"]`, sem `sectionId`) usado para invalidar todas as colunas do quadro de uma vez quando não se sabe exatamente quais seções foram afetadas (criação/movimentação de item).
- `analytics.query(request)` serializa o `AnalyticsQuery` inteiro com `stableStringify` (`src/lib/utils.ts` — `JSON.stringify` com as chaves de cada objeto ordenadas recursivamente) em vez de embutir o objeto cru na chave. Os hooks especializados de `use-analytics.ts` montam o mesmo request lógico com ordens de propriedade diferentes; sem essa normalização, duas queries idênticas na prática virariam entradas de cache distintas.

### Atualização otimista em cache de lista (`onMutate`/`onError`)

Além de `setQueryData` no `onSuccess` (que atualiza a query de **detalhe** assim que a mutação resolve, seja ela online ou uma cópia otimista devolvida por `queueEntityUpdate`), as mutações de **edição/exclusão que afetam uma lista** (`sections`, `comments`, `custom-fields`, `folders`, e o caso especial de `useMoveItemToSectionMutation` em `items`) também aplicam o patch diretamente na(s) query(ies) de lista via `onMutate`, com rollback em `onError`:

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

Isso existe porque `invalidateQueries` sozinho **não** é suficiente offline: o `QueryClient` roda com `networkMode: "online"` (padrão), então o refetch disparado por uma invalidação fica pausado (`fetchStatus: "paused"`) enquanto o navegador está offline — sem o patch otimista, um item apagado/editado offline continuaria visível na lista até a próxima reconexão, mesmo a mutação já tendo sido enfileirada com sucesso no outbox. Ver [§10](#10-sincronização-offline) para o caso mais elaborado (`useMoveItemToSectionMutation`, que precisa mover o item entre duas caches de coluna diferentes).

### Padrão de paginação

Duas estratégias coexistem, escolhidas por domínio conforme o volume de dados esperado:

- **Paginação real** (mantém `page` em state, usa `<Pager>`): itens de uma pasta/seção, convites, atividade, clientes (admin) — listas que podem crescer sem limite.
- **"Fetch tudo de uma vez"** (busca com `limit: MAX_PAGE_SIZE` — 100 — e usa `select` para expor só `.data`): workspaces do usuário, seções de uma pasta, custom fields, subitens, comentários de um item, sessões — listas realisticamente pequenas, evitando UI de paginação desnecessária.

### Invalidação após mutação

Cada hook de mutação invalida precisamente as queries afetadas (ex.: `useUpdateItemMutation` invalida `items.detail`, `items.all(folderId)` e `items.bySectionAll()` porque a seção pode ter mudado). Mutações que retornam a entidade atualizada frequentemente usam `setQueryData` para atualizar o cache imediatamente, além de invalidar listas relacionadas.

## 9. Cliente HTTP e tratamento de erros

### `apiClient` (`src/lib/api/client.ts`)

Instância axios única, `baseURL` de `NEXT_PUBLIC_API_URL`. Duas flags de config customizadas (via `declare module "axios"`):

- `_skipAuth`: pula a injeção do `Authorization` header (usado nos endpoints públicos de preview de convite).
- `_retried`: marca requests já reprocessadas pelo interceptor de refresh, evitando loop infinito.

Uma segunda instância (`refreshClient`) é usada só para `POST /auth/refresh`, para que ela nunca reentre no próprio interceptor de resposta.

### `src/lib/errors.ts`

`getErrorMessage(error)` mapeia cada `ErrorCode` do domínio (definido em `src/types/common.ts`, ~45 códigos — `INVALID_CREDENTIALS`, `ITEM_HAS_PENDING_SUBITEMS`, `SYNC_VERSION_CONFLICT` etc.) para uma mensagem amigável em pt-BR; cai para a mensagem da API ou uma genérica se o código for desconhecido, e trata erros de rede (sem `response`) separadamente. `getErrorCode(error)` extrai só o código, usado por telas que precisam de lógica condicional (ex.: `LoginForm` redirecionando em `EMAIL_NOT_VERIFIED`).

`isDomainError` (`types/common.ts`) faz o type-narrowing entre a resposta de erro de domínio (`{ code, message }`) e a de validação padrão do NestJS (`{ message: string[] }`).

## 10. Sincronização offline

A feature mais sofisticada do app. Implementa suporte a uso offline via o endpoint `/sync/push` + `/sync/pull` documentado no `API.md` (§13), **não** como uma camada geral de todas as operações — é aplicada seletivamente.

### O que é suportado offline

**Apenas edição/exclusão de entidades já existentes**: item, pasta, seção e definição de custom field (edição), e exclusão de item, seção e comentário. **Criar** qualquer entidade nova permanece online-only — criar offline exigiria id gerado no cliente + renderização otimista de listas + reconciliação de id, uma feature maior e distinta. Valores de custom field em itens também ficam online-only: ao contrário de toda outra entidade do §13, não têm campo `version`, então não há `baseVersion` para chave de concorrência otimista.

### Peças do motor (`features/sync/`)

- **`lib/outbox.ts`** — fila persistida em `localStorage` (`taskflow.syncOutbox`). `enqueueOperation` funde uma segunda edição offline da mesma entidade na operação `UPDATE` já pendente (em vez de empilhar), evitando que a segunda operação carregue o mesmo `baseVersion` da primeira e gere um `CONFLICT` falso contra a versão que a própria primeira operação acabou de produzir no servidor.
- **`lib/device-id.ts`** — id estável por navegador (`crypto.randomUUID()`, persistido), enviado em toda `SyncOperation.deviceId`.
- **`lib/cursor.ts`** — cursor de pull por workspace (`taskflow.syncCursor.<id>`); ausente = "nunca puxado" (equivalente documentado a `since=0`).
- **`lib/sync-engine.ts`** — orquestra tudo:
  - `queueEntityUpdate` / `queueEntityDelete`: enfileiram uma operação e devolvem uma cópia otimista da entidade (para o `onSuccess` da mutação atualizar o cache como se fosse online).
  - `pushImmediate`: envia uma única operação via `/sync/push` mesmo estando online — usado exclusivamente para limpar `assigneeId` de um item, a única escrita que a superfície REST não consegue expressar (`PATCH /items/:id` nunca aceita `assigneeId: null`; omitir o campo mantém o responsável atual).
  - `flushOutbox`: agrupa operações pendentes por workspace, envia cada grupo, reconcilia o cache por resultado (`APPLIED`/`CONFLICT`/`REJECTED`/`DUPLICATE`) e remove do outbox só o que o servidor de fato respondeu — o que falhar por estar ainda offline permanece na fila.
  - `pullChanges`: pagina `/sync/pull` até `hasMore` ser falso; como o formato de uma mudança é opaco (`SyncChange = Record<string, unknown>`), qualquer pull não-vazio simplesmente invalida os grupos de query relevantes (itens, pastas, seções, custom fields, comentários, atividade, analytics) em vez de tentar mesclar campo a campo — os endpoints REST continuam sendo a fonte de verdade. `activity`/`analytics` entram na mesma lista mesmo sendo só leitura: ambos derivam dos mesmos eventos de domínio que geraram as outras mudanças, então um dispositivo que puxou alterações de outro ficaria com o feed de atividade ou o dashboard desatualizados até o `staleTime` expirar naturalmente, se não fossem invalidados junto.
- **`lib/invalidate-entity.ts`** — único lugar com o mapeamento `entityType → queryKeys`. `invalidateByEntityChange` é chamado tanto pelo `flushOutbox`/`pushImmediate` (via `invalidateForEntity`, com dicas `folderId`/`itemId` vindas do `meta` da operação) quanto pelo listener de [tempo real](#tempo-real-sse) (sem dicas — cai no prefixo mais amplo, ex. `queryKeys.items.byFolderAll()`). `entityType` é `string`, não `SyncEntityType`: o canal de tempo real usa os tipos do log de auditoria (inclui `WORKSPACE` e `CUSTOM_FIELD`); um tipo desconhecido invalida tudo do workspace em vez de chutar um mapeamento estreito. `invalidateDerivedData` invalida atividade + analytics, que dependem de qualquer outra entidade.
- **`context/sync-context.tsx`** (`SyncProvider`) — dispara `flushOutbox` + `pullChanges` sempre que o navegador fica online, e a cada 30s como rede de segurança caso o evento `online` não dispare (ex.: aba que nunca recebeu o evento). Expõe `{ isOnline, pendingCount, isSyncing, syncNow }` via `useSync()`.
- **`components/sync-status-indicator.tsx`** — ícone na topbar (nuvem cortada / spinner / refresh com badge de contagem) que também permite forçar sync manual.

### Como os hooks de domínio decidem online vs. offline

Cada mutação elegível (`useUpdateItemMutation`, `useChangeItemStatusMutation`, `useMoveItemToSectionMutation`, `useUnassignItemMutation`, `useUpdateSectionMutation`, `useDeleteSectionMutation`, `useUpdateFolderMutation`, `useArchiveFolderMutation`, `useUpdateCustomFieldOptionsMutation`, `useArchiveCustomFieldMutation`, `useDeleteCommentMutation`) segue o mesmo padrão: se `isOffline()` (checa `!navigator.onLine`) **e** há um workspace atual **e** a entidade já está em cache, chama `queueEntityUpdate`/`queueEntityDelete` em vez do service HTTP; senão, segue o caminho REST normal. O toast de sucesso também muda de texto ("salvo offline — será sincronizado...") para deixar claro ao usuário que a alteração ainda não chegou ao servidor.

`SECTION`, `COMMENT` e `ITEM` suportam exclusão via sync (`ITEM` é *soft delete*; online, itens são apagados por `POST /items/bulk-delete`, então a exclusão de item via sync só é usada pela fila offline de `useDeleteItemsMutation`) — `FOLDER` e `CUSTOM_FIELD_DEFINITION` sempre voltam `REJECTED` se uma `DELETE` for enfileirada para eles (por isso essas duas entidades só têm mutações de *edição* offline: arquivar, não apagar).

### Caso especial: mover item entre colunas offline (`useMoveItemToSectionMutation`)

O quadro Kanban renderiza cada seção como uma query paginada independente (`items.bySection(sectionId, page)`) — um item "pertence" à cache da sua coluna, não a uma lista única da pasta. Uma movimentação entre colunas offline precisa, portanto, tocar **duas** caches ao mesmo tempo: remover o item da coluna de origem e inseri-lo na de destino. `onMutate` faz isso varrendo toda página atualmente em cache sob o prefixo `items.bySectionAll()` (`queryClient.getQueriesData` com matching parcial de chave) até achar o item, removendo-a de onde estava, e inserindo uma cópia (com `sectionId` já atualizado) em toda página em cache da seção de destino — ajustando `meta.total`/`meta.totalPages` dos dois lados. Reordenar dentro da **mesma** coluna não recebe esse tratamento: o item nunca desaparece nesse caso, só assenta na posição exata quando o próximo `pullChanges` reconciliar — um `onMutate` que reordenasse com precisão dentro de uma página paginada teria risco/complexidade desproporcional ao ganho.

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
| **auth (senha)** | `PATCH /auth/password`, `POST /auth/password` | `SecuritySettingsSection` em `/settings/profile` escolhe o formulário por `hasPassword` (`GET /auth/me`): com senha → alterar (senha atual + nova; `CURRENT_PASSWORD_INCORRECT` vira erro no campo); sem senha → definir (nova senha + ID Token do Google via `useGoogleIdentityToken`, o mesmo hook do `ReauthDialog`; o token vai direto na requisição, sem estado). Ambos revogam as outras sessões (a atual continua válida); definir invalida `GET /auth/me`. Só existe em Configurações — nunca linkado a partir do chat do assistente. |
| **auth (vincular Google)** | `POST /auth/google-link` | Segundo card de `SecuritySettingsSection`, só com `hasPassword && !googleLinked` (com `googleLinked` mostra apenas "Conta Google vinculada"; desvincular não existe). Senha atual + ID Token via `useGoogleIdentityToken` (o botão do Google é o submit). `CURRENT_PASSWORD_INCORRECT` vira erro no campo; `GOOGLE_ACCOUNT_ALREADY_LINKED`/`INVALID_GOOGLE_TOKEN` viram toast. Revoga as outras sessões e invalida `GET /auth/me`. |
| **sessions** | `/auth/sessions` | Lista/revoga sessões (dispositivos); `useLogout` revoga a sessão atual (best-effort) e sempre limpa o estado local mesmo se a chamada falhar. |
| **workspaces** | `/workspaces`, `/workspaces/:id`, `/members`, `/invitations`, `/assistant-settings` | CRUD + membros + convites; exclusão exige workspace vazio (só o `OWNER` sozinho) e papel `OWNER`. `assistantEnabled` (`PATCH /workspaces/:id/assistant-settings`, só `OWNER`) liga/desliga o [assistente de IA](#assistente-de-ia-com-ações) para o workspace — nasce `false` em todo workspace novo, e o backend também pode desligar sozinho (kill switch, ver abaixo); reativar sempre exige um `OWNER` de novo, nunca é automático. UI: página própria `/assistant` (`WorkspaceAssistantSettingsPanel`), visível a todos os papéis (o toggle em si só fica habilitado para `OWNER`). O seletor de papel de membro existente (`MembersTable`) só lista/permite `OWNER` quando quem está agindo já é `OWNER` (`canGrantOwnerRole` em `src/lib/permissions.ts`) — vale tanto para promover quanto para rebaixar um `OWNER` existente, espelhando a mesma regra do backend. |
| **folders** | `/workspaces/:id/folders`, `/folders/:id`, `/archive`, `/move` (PATCH), `/members`, `/invitations` | Sem exclusão — só arquivamento (`FolderStatus: ACTIVE \| ARCHIVED`). Papel de gestão herdado do workspace ([§6](#6-autorização-e-papéis)). Hierárquico (`parentId`) — ver [Hierarquia](#hierarquia-pastas-seções-e-comentários). |
| **folder-templates** | `/folder-templates` (+ `/categories`, `/:id`), `/workspaces/:id/folder-templates` (+ `/:id/instantiate`), `/folders/:id/save-as-workspace-template`, `/admin/folder-templates` (+ `/remove`, `/restore`) | Modelos do sistema (globais) e modelos privados do workspace — ver [subseção dedicada](#modelos-de-pasta). |
| **sections** | `/folders/:id/sections`, `/sections/:id`, `/sections/:id/move` (PATCH) | Colunas do quadro Kanban; uma seção "padrão" (`isDefault`) não pode ser apagada; exclusão exige seção vazia (sem itens nem subseções — `SECTION_HAS_CHILDREN`). Hierárquica (`parentId`) — **protótipo**, ver [Hierarquia](#hierarquia-pastas-seções-e-comentários). |
| **items** | `/folders/:id/items`, `/items/:id`, `/items/:id/status`, `/items/:id/subitems`, `/items/:id/attachments`, `/items/:id/cover` | Entidade central. Suporta subitens (`parentItemId`), anexos (upload multipart, limite de 20MB, download via blob), capa (imagem JPEG/PNG/WebP até 10MB, `PUT/GET/DELETE`; o binário é autenticado, então é buscado como blob e o cache é chaveado por `version`), prioridade e prazo (uma vez definidos, só podem ser trocados por outro valor — não removidos pela API). |
| **custom-fields** | `/folders/:id/custom-fields`, `/custom-fields/:id/options`, `/archive`, `/items/:id/custom-field-values` | Tipos: `TEXT`, `NUMBER`, `DATE`, `SINGLE_SELECT`, `MULTI_SELECT`, `CHECKBOX`, `PEOPLE`. Arquivamento em vez de exclusão. |
| **comments** | `/items/:id/comments`, `/comments/:id` | Sem `version` (não versionado) — exclusão offline sempre reaplica ao sincronizar; a UI remove o comentário do cache otimisticamente (`onMutate`) porque o `invalidateQueries` sozinho não refetcha enquanto offline. Autor **ou** `OWNER`/`ADMIN` do workspace pode apagar (`canManageWorkspace`); a API sempre revalida. Criação é sempre online-only, como toda entidade do app — nunca passa pelo outbox. Respostas em thread via `parentId` (ver [Hierarquia](#hierarquia-pastas-seções-e-comentários)); a API bloqueia apagar um comentário que ainda tem respostas (`COMMENT_HAS_CHILDREN`). |
| **activity** | `/workspaces/:id/activity`, `/folders/:id/activity`, `/items/:id/activity` | Três timelines com o mesmo `ActivityFeed`: a do workspace é uma seção de `/workspaces` (`WorkspaceActivitySection`), a da pasta é a aba Atividade (`FolderActivitySection`, filtrada no backend pela coluna `folderId`) e o do item fica no detalhe do item. Feed de auditoria paginado (genuinamente ilimitado — cresce a cada edição de status/responsável/movimentação/comentário). O endpoint de item devolve uma timeline **unificada**: eventos de `comments.comment_created` aparecem tanto no feed de atividade quanto no `CommentList` acima dele — repetição intencional (mesmo padrão do GitHub/Linear: o feed é o resumo cronológico, os comentários acima são o conteúdo completo). `describeActivityEntry` (`activity-event-label.ts`) traduz `eventType` para pt-BR por correspondência de substring. **Confirmado contra o código do backend** (`item.events.ts`/`comment.events.ts`): todo `eventType` é uma string literal fixa por classe de evento, sem transformação entre o evento de domínio e a resposta da API — o backend é consistente e bate exatamente com o `API.md` § 14. A correspondência por substring é defensiva por escolha (tolera um `eventType` novo ou uma troca de chave de payload sem exigir deploy do frontend em lockstep), não uma correção para uma inconsistência real — não é "gambiarra" a simplificar para um mapa exato. |
| **analytics** | `/analytics/query` (POST), `/analytics/query/natural-language` (POST) | Query builder genérico: `entity` (`items`\|`folders`) + `filters` + `groupBy` + `metrics`. Hooks especializados (`use-analytics.ts`) montam queries prontas — `useTotalItemsCountQuery`, `useCompletedItemCountQuery`, `useItemsByStatusQuery`, `useItemsByAssigneeQuery`, `useItemsByFolderQuery`, `useOverdueItemsByFolderQuery`, `useFoldersByStatusQuery` — nenhum componente monta um `AnalyticsQuery` manualmente. Toda query exige `workspaceId` (`enabled: false` se ausente) e usa `staleTime: 60_000` (o dobro do default) porque dado agregado muda menos que uma leitura de entidade individual. `NaturalLanguageQueryBox` (no topo do dashboard) traduz uma pergunta em texto livre para o mesmo `AnalyticsQuery` via IA (backend), que executa o mesmo pipeline/whitelist de `POST /analytics/query`; a interpretação (`query`) é sempre exibida ("Entendi como: ...") antes do resultado, nunca escondida. Sem `groupBy` o resultado vira `StatCard`s, com `groupBy` um `CategoryBarChart` (top 10) — os mesmos componentes dos gráficos fixos, sem renderer próprio. Uma métrica `derived` pode vir `null` por grupo (dado insuficiente): grupos `null` são omitidos do gráfico e o `StatCard` mostra "Sem dados", nunca `0` (`features/analytics/lib/derived-metrics.ts` formata taxas como percentual e durações como "3d 4h"). É uma mutação (`useNaturalLanguageQueryMutation`), não uma query — cada pergunta é uma ação nova, e o resultado fica só em `mutation.data`, nunca no cache do TanStack Query. Erros por código: `AI_RATE_LIMIT_EXCEEDED`, `AI_TRANSLATION_FAILED`, `INVALID_ANALYTICS_QUERY` (mensagem própria nesse contexto: aqui significa que a IA entendeu mal a pergunta, não que um gráfico fixo quebrou) e `FORBIDDEN_WORKSPACE_ACTION`. |
| **folder-stats** | `/analytics/query` (POST) | Aba Estatísticas da pasta — ver [subseção dedicada](#estatísticas-do-pasta). Sem endpoint próprio: só queries de analytics filtradas por `folderId`. |
| **automations** | `/workspaces/:id/automation-rules` (GET/POST/PATCH/DELETE) | Regras "quando X, então Y" que rodam sem confirmação; toda a API é `OWNER`/`ADMIN` (`canManageAutomations`), então a aba "Automações" da pasta nem aparece para os demais. Ver [subseção dedicada](#automações) abaixo. |
| **developers** | `/workspaces/:id/api-keys`, `/api-keys/:id/rotate`, `/workspaces/:id/webhook-endpoints`, `/webhook-endpoints/:id/{rotate-secret,ping}`, `/webhook-endpoints/:id/deliveries` | Chaves de API + webhooks do workspace, exclusivo de `OWNER`/`ADMIN` (`canManageDeveloperPlatform`). Três seções empilhadas na própria página (não abas): Chaves de API, Webhooks e Documentação da API (referência técnica). Ver [subseção dedicada](#plataforma-de-api-chaves-e-webhooks) abaixo. |
| **assistant** | `/assistant/chat`, `/assistant/actions/:id/confirm`, `/assistant/actions/:id/cancel` | Chat de IA com ações — ver [subseção dedicada](#assistente-de-ia-com-ações) abaixo. |
| **admin** | `/admin/clients`, `/suspend`, `/activate` (DELETE = encerrar), `/admin/clients/:id`, `/admin/ai-usage/users/:id` | Gestão de contas da plataforma, exclusiva de `SUPER_ADMIN`; ver [§6](#6-autorização-e-papéis) para como o acesso é inferido. `/admin/clients/[clientId]` (dados básicos + atribuição de plano + histórico de uso de IA) reaproveita `AiUsageHistory` (ver **plans** abaixo) apontada para o endpoint admin em vez de `/ai-usage/me`. |
| **plans** | `GET /plans`, `PATCH /plans/me`, `GET/POST /admin/plans`, `PATCH /admin/plans/:id`, `PATCH /admin/users/:id/plan`, `GET /ai-usage/me` (janelas) | Teto de tokens de IA por usuário/mês (`monthlyTokenBudget`). **Não é cobrança**: o backend `main` não tem preço/checkout/assinatura e qualquer usuário troca de plano de graça (API.md § 23) — a UI nunca fala em "assinar", preço ou pagamento. Os tetos diário (÷ 30) e semanal (÷ 4) são derivados em runtime pelo backend; `features/plans/lib/plan-caps.ts` (`derivedCaps`, `formatTokensHuman`, `quotaWindowStarts`, `DEFAULT_PLAN_NAME`) reproduz o cálculo só para exibição. `/settings/plan` (`PlanPicker`) mostra mensal + derivados em linguagem humana, as viradas em UTC (com o horário local equivalente), a regra do `FREE` para quem nunca escolheu e troca via `PATCH /plans/me` com confirmação; como a resposta não tem corpo e **nenhum endpoint devolve o `planId` atual do usuário** (confirmado contra `GetCurrentUserUseCase`/`ClientDetailDto` no backend — não é lacuna da doc), o plano recém-escolhido aparece como "Escolhido agora" só em estado local da tela, nunca persistido nem apresentado como "seu plano". `PLAN_NOT_FOUND` recarrega a lista. `UsageWindowsSummary` mostra o consumo de hoje/semana/mês (três `GET /ai-usage/me` com `from` no início de cada janela UTC e `limit=1`, lendo só `summary.totalTokens`; `staleTime` de 5 min, sem refetch em foco, botão "Atualizar"), **sem** comparar com teto nenhum. `/admin/plans` é CRUD de planos (`name` só na criação — chave estável, campo travado com explicação na edição), com os tetos derivados ao lado do input (`DerivedCapsHint`) e na tabela, e o `FREE` destacado como padrão da plataforma; atribuir/corrigir o plano de um cliente específico fica na página de detalhe do cliente (`AssignClientPlanCard`), sem pré-selecionar um plano "atual" pelo mesmo motivo. Uma UI de checkout via Stripe chegou a entrar (`1823dd8`) e foi revertida porque só existe no branch `feat/stripe-billing` do backend; volta como feature nova quando ele for mergeado. `AiUsageHistory` (`features/assistant/components/`) aceita um hook `useUsageQuery` injetável para ser reaproveitado tanto em `/settings/plan`/`/assistant` (`/ai-usage/me`) quanto na tela admin (`/admin/ai-usage/users/:id`), evitando duplicar o JSX. O envelope é `AiUsageResponseDto` (`items` + `summary`/`byFeature`, não `PaginatedResult`): a tela diz explicitamente que os totais cobrem o período inteiro e a tabela é só uma página; rótulos humanos por `feature` (Assistente / Perguntas em dashboards / Verificação de segurança, esta com tooltip) e tooltips sem jargão para tokens reaproveitados (`cachedTokens`) e de raciocínio (`thoughtsTokens`). O período é um preset de 7/30/90 dias limitado a 1..90 em `buildAiUsageDateRange` antes da chamada — `AI_USAGE_INVALID_RANGE` fica só como rede de segurança; as duas queries usam `AI_USAGE_QUERY_CACHE` (2 min, sem refetch em foco) por causa do throttle de 30 req/60s. O explicador rico (cálculo dos tetos, janelas UTC, o que acontece ao estourar o limite) não vive numa aba dentro de `/settings/plan`/`/admin/plans` — fica no guia "Plano e uso de IA" de `/tutorial` (ver [Tutorial](#tutorial)), com um link "Saiba mais" (`TutorialGuideLink`) visível direto na tela, não escondido atrás de outro clique. |
| **sync** | `/sync/push`, `/sync/pull` | Ver [§10](#10-sincronização-offline). |
| **realtime** | `/workspaces/:id/realtime/ticket` (POST), `/realtime/stream?ticket=` (SSE) | Sinais de invalidação em tempo real — ver [Tempo real](#tempo-real-sse). |
| **tutorial** | — (sem API) | Página `/tutorial` + tour guiado — ver [Tutorial](#tutorial). |
| **notifications** | `/notifications`, `/unread-count`, `/read-all`, `/:id/read`, `GET\|PUT /preferences` | Sino na topbar (`NotificationBell`); a lista só é buscada com o painel aberto. Título/texto vêm prontos em pt-BR do servidor. O realtime manda `{ type: "notification" }` só ao destinatário, que invalida `queryKeys.notifications.root()` (e as aprovações, se o tipo for `APPROVAL_*`); um refetch a cada 2 min cobre conexão caída. |
| **search** | `GET /workspaces/:id/search` | `GlobalSearch` (botão na topbar + Ctrl/⌘K), `Command` com `shouldFilter={false}` (o servidor já filtra/ranqueia), mínimo 2 letras, debounce 250 ms. Também é a fonte do seletor de dependências (filtrado por `folderId`). |
| **items (etapas)** | `GET\|POST /folders/:id/statuses`, `PATCH\|DELETE /statuses/:id` | Ver [Etapas, cronograma e lixeira](#etapas-cronograma-e-lixeira). |
| **recurring-items** | `/folders/:id/recurring-items` (+ `/preview`) | Ver [Itens repetidos](#itens-repetidas). |
| **time-tracking** | `/items/:id/timer/start`, `/timer/stop`, `GET /timer`, `/items/:id/time-entries`, `/time-entries/:id`, `/folders/:id/time-report` | Cronômetro global (`RunningTimerIndicator` na topbar, só quando roda), `ItemTimeSection` no painel do item e `FolderTimeReport` em Estatísticas. `useElapsedSeconds` soma ao `durationSeconds` do servidor o tempo desde o último fetch, sem relógio próprio. Uma pessoa = um cronômetro: iniciar em outro item para o anterior (`stopped` na resposta). |
| **approvals** | `POST\|GET /items/:id/approvals`, `GET /approvals/pending`, `POST /approvals/:id/approve\|reject\|cancel` | `ItemApprovalsSection` no painel; `PendingApprovalsCard` no Início (só aparece com pedidos). A lista pendente não traz o título: cada item busca o item (`useItemQuery`, cache compartilhado). |
| **saved-views** | `POST\|GET /folders/:id/views`, `PATCH\|DELETE /views/:id` | `SavedViewsMenu` na barra do quadro. `lib/saved-view-mapping.ts` converte os filtros do quadro ↔ `config` (estrito no servidor); o que não cabe no `config` (sem prioridade, sem prazo, datas de criação/atualização, participante, menção, anexos, descrição, "só subitens") é avisado ao salvar. `dueWithinDays` é nosso: 0 = hoje, 7 = próximos 7 dias, -365 = atrasadas. |
| **intake-forms** | `/folders/:id/forms`, `/intake-forms/:id` (+ `/regenerate-token`), público `GET /forms/:token` e `POST /forms/:token/submissions` | Construtor em Configurações (`IntakeFormDialog`): a `key` de cada campo é gerada do rótulo; regras do backend espelhadas (um campo por destino, título obrigatório e TEXT/LONG_TEXT, prazo só DATE, prioridade só SELECT). A página pública usa `_skipAuth` como as páginas compartilhadas e manda o honeypot `website`. |
| **data-portability** | `/folders/:id/imports/preview`, `/folders/:id/imports`, `/folders/:id/exports`, `/data-jobs/:id` (+ `/download`) | Em Configurações. A prévia roda de novo a cada troca de mapeamento (multipart, `mapping` em JSON); o job é acompanhado por polling de 1,5 s até DONE/FAILED, e um import concluído atualiza as listas de itens e colunas. |

### Quadro Kanban (`features/items/components/item-board.tsx` + `section-column.tsx`)

- Duas visualizações alternáveis e persistidas em `localStorage` (`useItemViewMode`): lista compacta (`ItemLineItem`) ou cartões (`ItemCardItem`).
- **Drag-and-drop nativo do HTML5** (sem lib externa) — `src/lib/dnd.ts` define os MIME types customizados (`application/x-taskflow-item`, `application/x-taskflow-section`) que permitem a uma coluna distinguir "um item foi solto aqui" de "outra coluna foi solta aqui", já que `dragover` só expõe `dataTransfer.types` (não o payload) durante o arrasto. `setLiftedDragImage` aplica um efeito visual de "elevação" (leve rotação/sombra) diretamente ao elemento sendo arrastado antes de tirar o snapshot do navegador para a imagem de arrasto.
- `useItemDropTarget` / `useSectionDropTarget`: hooks reutilizáveis que decidem se o item solto entra acima/abaixo (itens) ou à esquerda/direita (seções) do alvo, com base na posição do cursor dentro do bounding box do elemento.
- Colunas são redimensionáveis por arrasto (Pointer Events + `setPointerCapture`, para não perder eventos se o cursor sair da alça de 12px durante um arrasto rápido); a largura é persistida por seção em `localStorage`.
- Reordenar/mover itens entre colunas passa por `useMoveItemToSectionMutation`, que aceita `position` explícito para inserir entre vizinhos específicos, não só no fim da lista.
- **Seleção múltipla** (`ItemSelectionProvider`, em `features/items/context/`): montado no `ItemBoard` e na página de coluna própria, guarda *snapshots* dos itens marcados (checkbox no cartão e na linha da tabela, "selecionar todas" no cabeçalho da coluna/tabela; com algo marcado, clicar num cartão alterna a seleção em vez de abrir o item). A `ItemSelectionBar` flutuante move as marcadas para outra coluna (`useMoveItemsToSectionMutation`) ou as apaga (`useDeleteItemsMutation`). Arrastar um item marcado arrasta a seleção toda, com a mesma regra de "só entre colunas do mesmo nível" aplicada ao grupo (tudo ou nada). Mover e apagar usam as rotas em massa do backend (`PATCH /items/bulk`, `POST /items/bulk-delete`, até 100 itens por chamada — `itemsService` divide lotes maiores em chamadas sequenciais e reindexa os resultados). Elas respondem sempre `200` com sucesso parcial e sem rollback: cada item traz `SUCCESS`/`FAILED`, e os itens que falharam continuam marcadas. Apagar leva os subitens junto (`deletedSubitemIds`) e trata `ITEM_NOT_FOUND` como sucesso (o subitem pode já ter sumido em cascata). Criar em massa (`POST /folders/:id/items/bulk`) existe como `useBulkCreateItemsMutation`, ainda sem tela que o use. Offline, mover e apagar caem na fila do sync, uma operação por item.

### Hierarquia (pastas, seções e comentários)

A API devolve as três hierarquias como **lista plana com `parentId`**; `src/lib/tree.ts` (`buildTree`, `collectDescendantIds`, `getAncestors`, `flattenTree`) reconstrói a árvore no cliente a partir do cache já carregado. Um item cujo pai não está na lista (filtrado ou fora da página) vira raiz em vez de sumir.

- **Pastas** — `FolderTree` (colapsável, começa aberta) na página `/folders`; "Criar subpasta" reaproveita `CreateFolderDialog` com o pai fixo; mover é uma ação separada (`PATCH /folders/:id/move`, online-only — não existe operação de reparent no motor de sync). `ParentPickerDialog` (compartilhado com seções) desabilita o próprio item, seus descendentes e pastas arquivadas, calculados da árvore em cache, antes de o usuário escolher. Breadcrumb só em subpastas. `FOLDER_HAS_CHILDREN` (409) tem mensagem própria.
- **Comentários** — `CommentNode` renderiza a thread recursivamente; a indentação visual para no nível 3 (`MAX_INDENT_LEVEL`), a profundidade dos dados é ilimitada. O botão de apagar fica desabilitado enquanto há respostas.
- **Seções (protótipo, a validar com uso real)** — só seções raiz são colunas do quadro; as subseções aparecem como accordion vertical dentro da coluna do pai (`SectionColumn` com `variant="nested"`, recursivo), atrás de "+N subseções". Itens só se movem por arrasto entre seções **com o mesmo pai**; entre níveis, pelo seletor de seção do item (que lista o caminho "Pai / Filha"). Cada seção marca a própria drop zone com `data-section-drop` porque os eventos de arrasto de uma subseção sobem pelo DOM até o pai. Fora desta rodada, de propósito: arrastar seção inteira e arrastar entre níveis.

### Painel de detalhe de item

`ItemDetailView` é compartilhado entre a página cheia (`/items/[itemId]`) e um `Sheet` lateral (`ItemDetailSheet`, montado no layout da pasta e controlado por `?itemId=` na URL via `useItemPanel` — sobrevive a refresh e é compartilhável, ao estilo do painel de item do Asana). Agrega: título/descrição, subitens, anexos, seção/status/responsável/prazo/prioridade (cada um com seu próprio seletor e sua própria mutação), campos personalizados, comentários e histórico de atividade — sempre nessa ordem, com comentários e atividade sempre por último independente do `layout` (`grid` na página cheia, `stacked` no painel).

### Assistente de IA com ações

Chat de IA (`features/assistant/`) acessível de qualquer tela via ícone fixo na topbar (`AssistantChat`), aberto como `Sheet` — mesmo padrão de painel lateral do `ItemDetailSheet`. Desligado por padrão em todo workspace (ver linha `assistantEnabled` acima); a `AssistantChat` checa `useCurrentWorkspace().workspace.assistantEnabled` e desabilita o input com uma nota explicativa em vez de tentar enviar mensagens.

- **Conversa ao vivo no reducer, histórico salvo no backend**: a conversa atual e a lista de ações confirmadas vivem num `useReducer` dentro do próprio `AssistantChat` (`{ transcript: ChatTranscriptMessage[], confirmedActions: ConfirmedActionSummary[] }`), fora do TanStack Query — o chat da API é stateless e o cliente reenvia `history` (no máximo as 50 últimas mensagens) a cada turno. O backend grava cada turno (API.md § 16, "Histórico de conversas"): o `done` devolve um `conversationId`, que o chat guarda e manda de volta no turno seguinte. **`AssistantChat` nunca desmonta** (renderizado incondicionalmente pela topbar, só o `Sheet` abre/fecha), então fechar o `Sheet` mantém a conversa para a próxima abertura (só aborta o stream em andamento); "Nova conversa", "Encerrar e revisar" e a troca de workspace zeram o reducer e o `conversationId`. O botão de histórico (`AssistantConversationHistory`) lista as conversas do workspace (`useAssistantConversationsQuery`, paginação por cursor) e retoma uma lendo todas as mensagens (`useLoadAssistantConversationMutation`) e convertendo em transcript; ações propostas em turnos antigos voltam só como registro (`pastActions`), nunca confirmáveis — a API não guarda se foram confirmadas e elas já expiraram.
- **`PendingAction`**: toda tool de escrita vira uma ação pendente com `riskLevel: "standard" | "critical"` — exceto as de "guardar informação" (`save_information`, `undo_saved_information` e, quando o destino já existe, `relocate_information`), que rodam na hora e chegam em `executedActions` da resposta do chat; elas aparecem como "✅ <rótulo>" na mensagem (`lib/tool-labels.ts`) e passam pelo mesmo `applyConfirmedActionEffects` de uma ação confirmada, no `onSuccess` de `useSendChatMessageMutation`. `PendingActionCard` sempre mostra `humanDescription` **e** todos os `params` (via `PendingActionDetails`, componente compartilhado — nunca só a frase gerada pela IA), em forma legível: nome do campo traduzido, enum pelo rótulo, id pelo nome que o cliente já tem em cache (senão abreviado, nunca omitido — `lib/describe-params.ts` + `useEntityNameLookup`); para tools de update também mostra o `diff` "de → para" que o backend calcula do estado real. Exige um clique explícito em "Confirmar"/"Cancelar" — nunca uma mensagem de chat é interpretada como confirmação, essa é a regra de segurança central do componente.
- **Reautenticação para ações `critical`** (`delete_workspace`, `remove_workspace_member`, `archive_folder`, `revoke_session`): confirmar abre `ReauthDialog`, um modal **bloqueante** (não um passo inline no card — `onInteractOutside`/`onEscapeKeyDown` desabilitados, só fecha pelos botões "Confirmar"/"Cancelar" do próprio modal) que repete `humanDescription`/`params`. O campo mostrado depende de `hasPassword`/`googleLinked` (`GET /auth/me`, via `useCurrentUserQuery`): senha quando `hasPassword`, botão "Confirmar com Google" quando `googleLinked` (Google Identity Services, `google.accounts.id.renderButton`, mesma `NEXT_PUBLIC_GOOGLE_CLIENT_ID`/script de `GoogleSignInButton`, ver `src/lib/google-identity.ts`), os dois quando ambos — nenhuma navegação para fora do modal nem troca de sessão, é só uma confirmação de identidade pontual (o ID Token nunca é persistido, só passa pela chamada). `POST /assistant/actions/:id/confirm` aceita `{ reauth: { password } }` ou `{ reauth: { googleIdToken } }` — a API ainda não aceita reautenticação por 2FA. "Cancelar" do modal só fecha a etapa de reautenticação (a `PendingAction` continua pendente); cancelar a ação em si continua sendo o botão "Cancelar" do card. Credencial inválida (senha errada, ou e-mail do Google não batendo com a conta vinculada) retorna `REAUTHENTICATION_REQUIRED` e o modal deixa tentar de novo sem fechar.
- **`revoke_session` da própria sessão** (`isCurrentSession: true` no `PendingAction`): ao confirmar com sucesso, `useConfirmPendingActionMutation` limpa a sessão local (`clearSession`) e redireciona para `/login` — sem chamar `sessionsService.revoke` de novo, já que o backend já revogou a sessão dentro do próprio `confirm`.
- **Invalidação de cache mapeada tool → chaves, explicitamente** (`applyConfirmedActionEffects` em `use-assistant.ts`) — cada tool de escrita (`create_item`, `archive_folder`, `remove_workspace_member`, etc.) tem seu próprio `case` que decide `setQueryData`/`invalidateQueries`, sem fallback genérico "invalida tudo". O `result` de cada tool confirmada é o mesmo DTO que o endpoint REST equivalente devolveria (o backend chama o mesmo Use Case), então os `case`s fazem cast direto para `Item`/`Folder`/etc.
- **Contador + resumo de sessão**: o cabeçalho do `Sheet` mostra "N ações confirmadas nesta conversa" e um botão "Encerrar e revisar" (habilitado só com `N > 0`) — clicar substitui a lista de mensagens por `AssistantSessionSummary` (tool em label passado, `humanDescription`, horário) antes de fechar de verdade; nada disso chama o backend, é só o `confirmedActions` já acumulado no reducer a cada `PendingAction` confirmada.
- **Kill switch do backend**: 3+ sinais de conteúdo suspeito ou 3+ falhas de reautenticação em 10 min desligam o assistente automaticamente para o workspace (mesmo efeito de um `OWNER` desligar manualmente) — o frontend não precisa tratar isso como um caso especial, só reflete `assistantEnabled: false` na próxima leitura do workspace.

### Automações

`features/automations/` — vive só na aba "Automações" de cada pasta (ver o último item abaixo); não há mais página de workspace nem item na sidebar. Sem regras na pasta, a **galeria de templates** ocupa a aba (`AutomationTemplatesGallery`, 4 exemplos em `lib/automation-templates.ts`, limitados ao que a whitelist do backend consegue expressar — "quando o item for criado" não é gatilho); com regras, a lista (`AutomationRuleList`) ocupa a aba e a galeria fica atrás de "Ver modelos prontos". Escolher um template abre o formulário já preenchido, faltando só os valores do próprio workspace (qual seção/pasta), destacados em âmbar.

- **Construtor em frase, não dropdowns empilhados** (`AutomationSentenceBuilder`): "Quando [um item] [tiver o status alterado] e [o novo status] [for] [Concluída], então [mover o item] para a seção [Concluída]." Cada colchete é um campo inline (`InlineChip` + `Popover` + `Command` do shadcn — `cmdk` foi adicionada como dependência para isso —, com busca quando há mais de 6 opções, `SEARCH_THRESHOLD`). `lib/automation-catalog.ts` é a **cópia frontend** da whitelist do backend (eventos, campos de payload, ações `automatable`) porque não existe endpoint que a liste: um evento/ação novo no backend precisa ser adicionado aqui à mão (o backend valida ao salvar, então o descompasso falha com `INVALID_AUTOMATION_*`, nunca em silêncio).
- **`RuleDraft`** (`lib/automation-draft.ts`) é a forma editável (tudo string), convertida de/para a API só nas bordas (`fromRule` / `toRequest`). Trocar entidade/evento/ação descarta o que deixou de existir (`withEntity`/`withEvent`/`withTool`). O `itemId` da ação nunca é perguntado: sai do gatilho (`{{payload.entityId}}` em eventos de item, `{{payload.itemId}}` em comentário); eventos sem item só oferecem `create_item`. Parâmetros que o editor não conhece (ex.: `position` do `move_item`) são preservados em `extraParams` e avisados na tela, nunca descartados ao editar. Condições usam o tipo `AnalyticsFilter` e os mesmos operadores de analytics, mas não há componente de filtro de analytics para reaproveitar (os gráficos montam a query em código) — `TriggerConditionPicker` é o único seletor de filtro do app.
- **"Valor do evento" atrás de uma segunda aba** dentro do campo do parâmetro (`ParamValueField`): o padrão é "Valor fixo"; o placeholder `{{payload.CAMPO}}` só nasce ao escolher um campo do evento numa lista compatível com o tipo do parâmetro — ninguém digita a sintaxe.
- **Preview ao vivo** (`AutomationLivePreview`, fixo no topo do diálogo) mostra a frase completa a cada mudança; a mesma função (`describeDraft`) alimenta a lista de regras e o nome automático (nome em branco = a própria frase, cortada em 120).
- **Nomes reais em vez de ids** (`useAutomationLookups`): seções não têm endpoint por workspace, então busca as seções de cada pasta (mesma `queryKey` do quadro — pasta já aberta vem do cache) e resolve pastas/membros pelo cache existente.
- **Aba "Automações" da pasta** (`/folders/:id/automations`, `FolderAutomationsSection`; aba só aparece com `canManage` da pasta, que é o mesmo `OWNER`/`ADMIN`): regras não têm `folderId` — pertencem ao workspace —, então o vínculo com a pasta é deduzida do conteúdo em `lib/folder-scope.ts` (`folderRelation`). **"Desta pasta"** = cita a pasta (condição `folderId` `equals`/`in` com ele, condição de seção com uma seção dele, ou ação `create_item` nele / `move_item` para uma seção dele). **"De todo o workspace"** (segundo `Card`, com aviso de que mexer ali afeta todas as pastas) = sem condição de pasta/seção e gatilho que acontece dentro de pastas (item, comentário, seção, campo extra). Regras limitadas a outras pastas, ou com `folderId notEquals` este, não aparecem.
- **Só gatilhos de dentro de pasta**: o construtor oferece apenas `ENTITY_TYPES` = item, comentário, seção e campo extra (`automation-catalog.ts`). Eventos `FOLDER`/`WORKSPACE` continuam em `TRIGGER_EVENTS` só para descrever regras antigas: `isOutsideFolders` as separa num terceiro `Card`, "Automações antigas do workspace", presente em toda aba de pasta, com pausar/excluir mas sem editar (`AutomationRuleList` sem `onEdit`). Criar pela aba passa o rascunho por `scopeDraftToFolder`, que adiciona "a pasta for X" (quando o evento carrega `folderId`) e preenche a pasta do `create_item`; o diálogo recebe `folder` e mostra se a regra ainda está limitada — trocar para um evento sem `folderId` (ex.: participantes) descarta a condição em `withEvent`, e o aviso âmbar oferece "Limitar a esta pasta" quando dá.
- **Ainda não implementado** (o backend não expõe): teste/dry-run (`POST …/:id/test`), histórico de execuções (`GET …/activity?automationRuleId=`; hoje as entradas só trazem `triggeredByAutomationRuleId`, sem filtro) e `disabledReason`. Enquanto isso, a linha "Desativada" lista as causas possíveis num tooltip em vez de afirmar uma; religar é um `PATCH { enabled: true }` direto.

### Plataforma de API (chaves e webhooks)

`features/developers/` — página própria `/developers` (`DevelopersSection`), item de sidebar visível só com `canManageDeveloperPlatform` (`OWNER`/`ADMIN`; a API nega até listagem para os demais). Três seções empilhadas na página (`Card`s, não abas): Chaves de API (`ApiKeysPanel`), Webhooks (`WebhooksPanel`) e Documentação da API (`ApiReferenceSection`).

- **Chaves de API** (`ApiKeysPanel`/`api-key-list.tsx`/`api-key-form-dialog.tsx`): credencial de máquina sem usuário dono (`tfk_live_…`/`tfk_test_…`), com escopos de uma whitelist fechada (`ApiKeyScope` em `src/types/developer.ts` — `items:read/write`, `folders:read/write`, `workspace:read`, `webhooks:manage`) espelhada à mão no frontend, já que não existe endpoint que a liste. O `plainKey` completo só aparece uma vez, na criação/rotação (`useRotateApiKeyMutation`) — depois disso só o `keyPrefix` mascarado. Revogar é definitivo, sem "reativar".
- **Importante, e destacado na própria UI**: uma chave de API criada aqui já autentica chamadas normais da API (`GET /items`, etc.) via `Authorization: Bearer <chave>`, respeitando o escopo concedido — deixou de ser só a fundação da plataforma. Webhooks continuam entregando eventos de ponta a ponta, como antes.
- **Webhooks** (`WebhooksPanel`/`webhook-endpoint-list.tsx`/`webhook-endpoint-form-dialog.tsx`): endpoint HTTPS do workspace que recebe um `POST` assinado (`X-TaskFlow-Signature`, HMAC-SHA256 do corpo cru) a cada evento de uma whitelist fechada (`WEBHOOK_EVENTS` em `src/types/developer.ts`, mesmos identificadores de atividade/automações). `url` precisa ser `https://` e é validada contra SSRF no backend — `webhook-endpoint-list.tsx` mostra esse aviso antes de a chamada nem acontecer. Entrega tem retry automático (até 5 tentativas) e kill switch (10 falhas terminais seguidas desativa o endpoint sozinho); religar manualmente zera o contador. `WebhookDeliveriesSheet` lista o histórico de entregas de um endpoint (`GET …/deliveries`), com "reenviar" (`POST …/:id/redeliver`) por entrega. Um botão de "ping" dispara um evento sintético pelo mesmo caminho de uma entrega real, para validar a URL/assinatura sem esperar um evento de verdade.
- **Documentação da API** (`ApiReferenceSection`): referência técnica de **todo o API.md**, não só a § 22 — parâmetros de cada endpoint, exemplos de request/response em JSON e `curl`, o exemplo de verificação de assinatura HMAC em Node e uma tabela única com todos os códigos de erro de negócio (`GENERAL_ERRORS`, espelhando a § 1.2 inteira). Renderizada como UI real (`Table`/`Accordion`/`Badge`, não uma string Markdown) a partir de dados estruturados: `lib/api-reference-data.ts` traz os tipos (`ApiEndpoint`/`ApiParam`/`ApiErrorCode`), a tabela de erros e as rotas de chaves de API/webhooks (§ 22, o único recurso que uma API key gerencia sobre si mesma); cada outro recurso (auth/sessões, workspaces, pastas/seções, items/campos/comentários, analytics/sync/atividade, tempo real/automações, assistente, planos/uso de IA) tem seu próprio arquivo em `lib/api-reference/`, importando esses tipos. A página abre com um índice (`TOC`) de âncoras para os grupos de rotas — a lista é longa (espelha boa parte do backend), mas cada endpoint some por trás de um accordion colapsado, então só os títulos ficam visíveis por padrão. Fora do ar de propósito: administração da plataforma (`/admin/clients`, role `SUPER_ADMIN`) — não é algo que quem gerencia chaves/webhooks de um workspace (`OWNER`/`ADMIN` normal) precisa ou deveria ver aqui. `lib/developer-catalog.ts` continua reaproveitado só para os catálogos de escopos/eventos (não duplicados à mão). Antes disso, um `DeveloperDocs` embutido na feature havia sido substituído por um guia em `/tutorial`, com o racional de que uma aba de documentação "enterra" a informação para o público leigo do app; esta referência aqui é diferente por natureza — conteúdo puramente técnico (JSON, `curl`, códigos HTTP) que só interessa a quem já está integrando nesta página gated a `OWNER`/`ADMIN`. O guia "Chaves de API e webhooks" de `/tutorial` continua existindo para a parte conceitual (pra que serve, quando ignorar, como usar a UI), linkado no topo da página (`TutorialGuideLink`, `/tutorial#developers`); os dois se complementam em vez de duplicar. O mesmo racional de manter o explicador conceitual fora da feature levou o guia "Plano e uso de IA" para `/tutorial` em vez de uma seção em `/settings/plan`/`/admin/plans` (ver **plans** na tabela acima) — essa decisão não muda, só a de referência técnica pura como esta.

### Modelos de pasta

`features/folder-templates/` — contrato em `API.md` § 26 do backend. Na interface, sempre "modelo" (nunca "template").

- **Só dois tipos, ambos grátis**: os **do sistema** (`isSystemDefault`, mantidos pelo SUPER_ADMIN) e os **do workspace** (§ 26.7: privados, só membros veem, só OWNER/ADMIN salvam/editam/excluem/usam, e só no próprio workspace). O backend já removeu o hub da comunidade: `GET /folder-templates` e `GET /admin/folder-templates` só listam templates de sistema, e como a API rejeita query params desconhecidos (400), o app não manda `origin` nem nada fora do DTO. **Dependência**: os endpoints de modelo do workspace (`save-as-workspace-template`, `GET /workspaces/:id/folder-templates`) só existem no branch `feat/template-enrichment` do backend; contra o `main` dele, "Salvar como modelo" e a seção do workspace respondem 404.
- **Chaves**: o catálogo do sistema é global (sem `workspaceId`); só `folderTemplates.workspace(workspaceId)` depende do workspace. Usar um modelo (`useInstantiateFolderTemplateMutation(workspaceId)`) invalida `folders.all` desse workspace e navega para `/folders/{id}/items`.
- **O detalhe depende de quem pede** (`access: FREE | WORKSPACE`, `canInstantiate`): por isso nunca é semeado a partir do cache de uma lista, e respostas de admin (template completo, outro formato) só invalidam o detalhe em vez de escrevê-lo. Salvar/editar um modelo do workspace devolve o próprio detalhe e usa `setQueryData`.
- **Salvar como modelo** (header da pasta) chama `POST /folders/:id/save-as-workspace-template`. Um modelo de outro workspace (a pessoa é membro dos dois) aparece, mas "Usar" explica que é preciso trocar de workspace, porque a API só instancia no workspace dono.
- **Sugestões no "Nova pasta"** (`TemplateSuggestions`): primeiro os modelos do workspace (a busca pelo nome digitado roda no cliente, já que a lista vem inteira), depois os do sistema (busca no servidor).
- **Filtros na URL** (`useTemplateUrlFilters`): `search`, `category` e `page` ficam na query string. Chips e busca usam `router.push`, e a busca (com debounce) usa `router.replace`, para o voltar não refazer cada tecla. A caixa de busca só aceita o valor da URL quando ele não é o eco do que ela mesma enviou, para um `replace` atrasado não apagar as últimas teclas. As páginas envolvem o conteúdo em `<Suspense>` por causa do `useSearchParams`. A mesma barra de filtros serve à tabela de `/admin/templates`.
- **Rótulos de categoria** vêm de `GET /folder-templates/categories`; `lib/categories.ts` tem uma cópia local só para antes da resposta chegar. O `templateCount` que o endpoint devolve não é mostrado: ele conta também modelos da comunidade.
- **Instanciar não é idempotente**: o dialog bloqueia o reenvio enquanto a mutação está pendente **e** depois do sucesso, até a navegação. Como a API é tudo ou nada, toda mensagem de erro diz "nada foi criado". `409 REMOVED`/`404` tiram o modelo do cache.
- **Fora do escopo**: não há editor visual de skeleton para modelos de sistema. `adminCreate`/`adminUpdate` e os hooks correspondentes existem, sem tela.

### Estatísticas da pasta

`features/folder-stats/` — a aba `/folders/[folderId]/stats`, visível para qualquer membro (inclusive em pasta arquivada: é só leitura). Não há endpoint novo: tudo sai de `POST /analytics/query` (`API.md` § 12) com `entity: "items"`, o `workspaceId` da pasta e o filtro `folderId equals`, que no backend **soma a subárvore inteira** — por isso a UI avisa que as subpastas estão incluídas.

- **Queries** (`lib/folder-stats-queries.ts`): uma função pura `(folderId, workspaceId[, now]) => AnalyticsQuery` por indicador. Total, taxa de conclusão, taxa de atraso e tempo médio de conclusão saem de **uma** query com quatro métricas; `pickMetric` recorta cada uma pelo `alias` que a própria resposta declara (nunca por um alias adivinhado). `cycle_time` fica de fora de propósito: hoje é só um alias de `average_completion_time`. A série "criadas ao longo do tempo" usa `createdAt:week` (truncado em UTC, semana começando na segunda) nas últimas 12 semanas, e `fillEmptyWeeks` preenche com 0 as semanas sem itens, que o backend simplesmente não devolve — sem isso a linha pularia a semana vazia.
- **Hooks** (`hooks/use-folder-stats.ts`): um `useQuery` por indicador, com chave `["folder-stats", folderId, <indicador>]`, para cada card/gráfico carregar e falhar sozinho (`ErrorState` com retry por card). O "agora" dos filtros de data é lido quando a requisição sai, não no render, então não entra na chave. Uma pasta sem nenhum item troca a seção inteira por um único `EmptyState` com atalho para a aba Itens.
- **Por que `ChartRenderer`**: a aba desenha com o mesmo `ChartRenderer` das páginas de dashboard (`NUMBER`/`PIE`/`BAR`/`LINE`), que já concentra a paleta categórica validada (`--analytics-cat-*`), a ordem conhecida de status/prioridade, os rótulos de grupo, o "Outros" e a formatação de métricas (`formatMetricValue`/`formatDerivedMetricValue`, "Sem dados" para `null`). Um segundo conjunto de gráficos divergiria em cor, ordem e formato na primeira mudança de um deles. A única extensão foi um `label` opcional no card de número, para "Itens em aberto" não aparecer como o genérico "Quantidade". Nomes de responsáveis vêm do mesmo `ValueLabeler` (`useAutomationLookups`) que o dashboard logado usa; `null` vira "Sem responsável".
- **Frescor**: `queryKeys.folderStats.root()` é invalidado nos mesmos pontos que as listas de itens (`scheduleItemListsRefresh`, `patchItemInLists`, `invalidateByEntityChange` para `ITEM`/`FOLDER`, `invalidateDerivedData`, `invalidateWorkspaceData`, push do sync, ações do assistente) e ao mover uma pasta. Sempre a raiz inteira, nunca só o `folderId` do item: ela também conta nos números de todas as pastas acima dela.

### Início

`features/home/` + `app/(dashboard)/home/page.tsx`: a tela Início, destino padrão pós-login (fallback de `getSafeRedirectPath`) e alvo do logo. Não existe endpoint de "meus itens" entre pastas, então tudo sai de `POST /analytics/query` com o filtro `assigneeId equals <userId do JWT>` no workspace atual. Só o responsável principal conta; participantes e menções, não.

- **Queries** (`lib/home-queries.ts`): no mesmo formato de `folder-stats`, com uma função pura por indicador. São elas: progresso (`count` + `completion_rate` numa só query), em aberto, atrasadas (`dueDate lessThan now`), vencendo em 7 dias (`dueDate between [now, now+7d]`) e, agrupadas por `folderId`, em aberto e atrasadas por pasta. O agrupamento por pasta devolve uma linha por pasta raiz (roll-up do backend), e o nome sai da lista de pastas já carregada.
- **Hooks** (`hooks/use-home-stats.ts`): um `useQuery` por indicador, com chave `queryKeys.home.indicator(workspaceId, userId, indicador)`. O "agora" é lido quando a requisição sai. `queryKeys.home.root()` é invalidado em todos os pontos onde `folderStats.root()` é, porque a regra é a mesma: qualquer mudança de item mexe nos números.
- A descrição do cabeçalho traz uma frase que muda com os números (atrasadas → vencendo → tudo em dia), para dizer ao usuário por onde começar.

### Celebração ao concluir

`lib/celebrate.ts` dispara um confete curto (DOM + Web Animations API, sem dependência) a partir do último clique. `useChangeItemStatusMutation` o chama quando o status passa a `DONE` e antes não era, lendo o status anterior do cache em `onMutate`. Vale em todas as visões, inclusive na tabela silenciosa e offline. Nada acontece com `prefers-reduced-motion: reduce`.

### Etapas, cronograma e lixeira

- **Etapas** (`WorkflowStatus`): cada pasta tem as suas, sempre dentro de uma das três categorias (`TODO`/`IN_PROGRESS`/`DONE`, que continuam em `item.status`); `item.statusId` aponta a etapa (`null` = a padrão da categoria). `ItemStatusSelect` (cartão, subitem, painel e célula da tabela) agrupa por categoria; escolher a etapa **padrão** manda `{ status }` (funciona offline), qualquer outra manda `{ statusId }`. O editor (`WorkflowStatusesSection`) reordena trocando as posições de duas etapas (o servidor nunca renumera) e, ao apagar, pede a etapa que recebe os itens.
- **Dependências** (`ItemDependenciesSection`) + regra `folder.blockedItemCompletion` (`WARN`/`BLOCK`, em Configurações). Com `WARN`, `PATCH /items/:id/status` devolve `warnings` — mostrados num toast e retirados antes de guardar o item no cache.
- **Cronograma** (`FolderTimeline`): HTML + SVG próprios, sem biblioteca. As datas são contadas em **dias UTC**, porque o app grava as datas como meia-noite UTC do dia escolhido (`fromDateInputValue`).
- **Lixeira**: apagar itens virou exclusão reversível por 30 dias. O toast de exclusão tem "Desfazer" (`restoreItems`), e a aba Lixeira lista e restaura.
- **Offline**: `/sync/push` só aplica título, descrição, status, responsável, pai e coluna. `useUpdateItemMutation` envia só esses campos para a fila e avisa que o resto (datas, prioridade, estimativas, vários responsáveis, menções) precisa de conexão; trocar para uma etapa não padrão offline é recusado com uma mensagem.

### Itens repetidos

`features/recurring-items/` (aba **Repetições**). O `ScheduleEditor` monta a agenda (`DAILY`/`WEEKLY`/`MONTHLY`/`YEARLY`, intervalo, dias, horário, início/fim) e chama `POST .../preview` com debounce para mostrar as 5 próximas datas — a fonte da verdade do cálculo é o servidor. Toda agenda leva o fuso do navegador (`browserTimezone`), assim como a instanciação de modelos (`timezone`). `describeSchedule` escreve a agenda numa frase, também usada na prévia de modelos (`skeleton.recurrences`). A lista refaz a busca a cada minuto, porque `nextRunAt`/`enabled` mudam sozinhos; mudanças chegam também pelo realtime (`entityType: ITEM_RECURRENCE`). "Salvar como modelo" agora oferece levar itens, repetições e automações (`includeItems`/`includeRecurrences`/`includeAutomations`, todos desligados por padrão no backend).

### Tutorial

`features/tutorial/` — sem chamadas à API; todo o estado é local.

- **Página `/tutorial`**: 24 guias em 4 grupos (Comece por aqui, Trabalho do dia a dia, Recursos avançados, Conta e funcionamento), seguidos da matriz **Papéis e permissões** e de um **Glossário**. `TutorialGuides` é um accordion (`components/ui/accordion.tsx`, `type="multiple"`) com busca (ignora acentos; abre sozinha até 3 resultados), atalhos por guia e deep link por hash (`/tutorial#board` abre e rola até o guia).
- **`TutorialGuideLink`** (`components/shared/`): um link simples e sempre visível para `/tutorial#<guideId>`, usado por telas de feature (`DevelopersSection`, `/settings/plan`, `/admin/plans`) que precisam de documentação rica sem duplicá-la — em vez de embutir um explicador próprio numa aba interna da feature (que esconde a informação atrás de mais um clique, ruim para o público leigo a quem `/tutorial` é dirigido), a feature aponta para o guia certo.
- **Conteúdo é dado, não JSX** (`lib/tutorial-guides.ts`): cada guia tem `sections` (`intro`, `steps`, `bullets`, `callouts` dos tipos `tip`/`note`/`warning`), `faq`, `audience`, `related` e `href`. `GuideBody` renderiza tudo; adicionar ou editar um guia não exige mexer em componente. A busca indexa todo esse texto. `lib/tutorial-reference.ts` guarda a matriz de papéis (espelha `src/lib/permissions.ts` — atualizar os dois juntos) e o glossário.
- **Texto acompanha a interface**: os guias citam rótulos reais ("Nova pasta", "Mover para…", "Adicionar coluna", "Mais filtros") e chamam as seções do quadro de **colunas**, como a UI. Revisar quando o texto da interface mudar. O `AccordionContent` usa `h-auto` porque a primitiva fixa a altura medida na abertura, o que cortaria os `<details>` de dúvidas ao expandirem.
- **Tour guiado** (`TutorialTour`, montado no layout do dashboard): overlay com spotlight sobre elementos marcados com `data-tour="<id>"` (seletor de workspace, sidebar, botão do assistente, menu do usuário) e um cartão de passos. Sem biblioteca externa. Os passos ficam em `lib/tour-steps.ts` e miram só o shell (topbar/sidebar), então funciona igual em qualquer página. Passos cujo alvo não está visível quando o tour abre (sidebar no mobile ou recolhida) são descartados; passos sem `target` aparecem centralizados. Teclado: `Esc` sai, `←`/`→` navegam, e o foco fica preso no cartão. O overlay só monta enquanto aberto, para resolver os alvos contra o DOM daquele momento.
- **Persistência** (`context/tutorial-context.tsx`, `TutorialProvider`): `taskflow.tourSeen.<userId>` em `localStorage` (`completed` | `skipped`). Por usuário para que uma segunda conta no mesmo navegador também veja o tour; por navegador, como as demais preferências locais. Abre sozinho no primeiro acesso, depois que os workspaces carregam; sem `localStorage` disponível, não abre automaticamente (senão repetiria a cada carga). Pode ser refeito pelo menu do usuário ou pelo botão da página `/tutorial`.
- **Novo alvo de tour**: basta adicionar `data-tour="<id>"` ao elemento (o botão precisa repassar props ao DOM, como o `Button`) e um passo em `TOUR_STEPS`.

## 12. UI, design system e tema

- **shadcn/ui** (`components.json`, estilo `radix-nova`, cor base `neutral`, ícones `lucide`) gera os primitivos em `src/components/ui/` — não são editados manualmente fora de customizações pontuais; alterações de configuração passam pelo CLI `shadcn`.
- **Tokens de tema** em `src/app/globals.css`, definidos em OKLCH, com paletas separadas para claro/escuro (`:root` / `.dark`), aplicados via `next-themes` (`attribute="class"`, `defaultTheme="system"`). O componente `ThemeToggle` alterna entre os modos.
- **Identidade visual**: fonte Plus Jakarta Sans (`--font-sans`, também usada nos títulos). Os neutros compartilham o matiz do primário (275), o fundo do app é off-white e os cards são brancos, com a sombra suave `shadow-card` (e `shadow-card-hover` nos cards clicáveis) em vez de uma borda dura. Há um token `--success` para feedback positivo. A escala `text-xs`/`text-sm` foi redefinida para 13px/15px (`@theme` em `globals.css`), porque o app usa muito esses tamanhos e o público não é técnico. De `text-base` para cima, os valores são os do Tailwind.
- **Largura das páginas**: o layout do dashboard limita o conteúdo a `max-w-7xl`, centralizado. Telas que precisam de toda a largura (quadro de itens e grade de páginas de dashboard) renderizam `data-page-width="full"`, e o wrapper sai do limite via `has-data-[page-width=full]`. Páginas de leitura e formulário estreitam por conta própria (`mx-auto max-w-3xl`/`max-w-4xl`). A sidebar e a topbar são `sticky`.
- **Navegação**: `NAV_ITEMS` (`components/layout/nav-items.ts`) marca cada item com um `group`. `NAV_GROUPS` define a ordem e o rótulo dos grupos (Trabalho, Equipe, Ajuda, Conta, Administração), e grupos sem nenhum item visível não aparecem.
- **Gráficos**: `CategoryBarChart` (`features/analytics/components/category-bar-chart.tsx`) é um bar chart horizontal construído sobre Recharts via o wrapper `ChartContainer`/`ChartTooltip`/`ChartTooltipContent` do shadcn/ui (`src/components/ui/chart.tsx`). Cada barra recebe sua cor por linha via `<Cell fill={row.color}>` (não por série do `ChartConfig`, já que as categorias — pastas, responsáveis — são abertas e não fixas).
- **Paleta de gráficos**: `--chart-1..5` (tokens padrão do shadcn) **não** é usada em novos gráficos categóricos porque as duas primeiras cores falham em distinção segura para daltonismo (CVD) quando adjacentes. Uma paleta dedicada `--analytics-cat-1..6` (com valores próprios claro/escuro) é a referência validada usada por `AnalyticsDashboard`/`CategoryBarChart`.
- **`cn()`** (`src/lib/utils.ts`) é apenas um re-export do pacote `cn` (não a implementação local `clsx`+`tailwind-merge` mais comum em outras pastas shadcn) — usado em todo o código para compor classes condicionalmente.
- Componentes compartilhados de padrão de tela em `components/shared/`: `PageHeader`, `EmptyState`, `ErrorState` (mostra a mensagem já traduzida via `getErrorMessage` + botão "Tentar novamente"), `ConfirmDialog` (wrapper de `AlertDialog` para confirmações destrutivas), `Pager`, `RoleGate`, `StatusBadge.tsx` (badges tipados para todo enum de status do domínio: pasta, item, prioridade, prazo, papel de workspace, convite, cliente), `MemberAvatar`/`MemberIdLabel` (foto ou iniciais + nome; o nome vem da prop `name` ou da lista de membros do workspace atual, e só quem não tem nome de perfil — ou está fora do workspace atual — fica com o id abreviado).

## 13. Formulários e validação

Padrão para todo formulário (o de lançar horas, `LogTimeForm`, usava `useState` e foi migrado): `react-hook-form` + `zodResolver` + os componentes `Form`/`FormField`/`FormItem`/`FormControl`/`FormMessage` do shadcn (wrappers sobre Radix). Schemas zod vivem em `schemas.ts` de cada feature (`features/auth/schemas.ts`, `features/items/schemas.ts`, etc.), exportando também o tipo inferido (`z.infer<typeof schema>`) usado como tipo genérico do `useForm`. Mensagens de validação já nascem em pt-BR nos próprios schemas.

## 14. Convenções de código

- **Vertical slice por domínio**: cada pasta em `features/` é dona de sua API, hooks, componentes e schemas — evita um `services/` ou `hooks/` monolítico compartilhado.
- **Um hook por operação de mutação**, nomeado pelo verbo (`useCreateXMutation`, `useUpdateXMutation`, `useArchiveXMutation`...), sempre com `onSuccess` (toast + invalidação) e `onError` (`toast.error(getErrorMessage(error))`) definidos no próprio hook — componentes não tratam erro de mutação manualmente.
- **Preferências puramente locais** (modo de visualização do quadro, largura de coluna, workspace selecionado) vivem em `localStorage` via hooks dedicados, nunca em query params nem sincronizadas com o servidor — documentado explicitamente nos comentários desses hooks.
- **Comentários no código** são usados com moderação e só para decisões não óbvias (por que um MIME type customizado, por que `setTimeout` em vez de `requestAnimationFrame`, por que um campo é opaco) — não para descrever o que o código faz.
- **`"use client"`** é declarado por arquivo conforme necessário; páginas que só compõem componentes client-only ainda assim costumam ser marcadas para deixar explícito o boundary.
- **Views com estado local precisam de `key={id}`** quando podem trocar de identidade sem desmontar: `ItemDetailView` (chave `itemId`, tanto na rota cheia quanto no `ItemDetailSheet`), `WorkspaceActivitySection` e `AnalyticsDashboard` (chave `workspaceId`) forçam remount ao trocar de item/workspace. Sem isso, componentes React re-renderizam no lugar em vez de remontar quando só a prop de identidade muda — estado local (página de paginação, rascunho de formulário) vazaria de um item/workspace para o próximo em vez de resetar. Qualquer view nova com estado local (`useState`) escopado a um id — não só cache de query — precisa do mesmo tratamento.

## 15. Limitações conhecidas

Herdadas diretamente da API (não são bugs do frontend):

- **O admin não lê o plano atual de um cliente** — `GET /admin/clients/:id` não traz o plano, então a atribuição em `/admin/clients/[clientId]` avisa que só dá para atribuir um novo. O próprio usuário vê o seu em `/settings/plan` (`GET /plans/me`).
- **`TOKEN_QUOTA_EXCEEDED` não diz qual janela estourou** (dia, semana ou mês — API.md § 23) — o aviso no chat do assistente só diz que o limite do plano foi atingido e que libera sozinho, com link para `/settings/plan`, sem afirmar uma janela. Os limites de frequência (`AI_RATE_LIMIT_EXCEEDED`/`AI_ASSISTANT_RATE_LIMIT_EXCEEDED`) têm texto próprio ("muitas perguntas em pouco tempo") para não serem confundidos com o plano. Hoje só o assistente consome IA na UI: a pergunta em linguagem natural (`NaturalLanguageQueryBox`, `POST /analytics/query/natural-language`) saiu junto com a página `/analytics` em `ee433bd` e ainda não voltou nas dashboard pages — quando voltar, deve reusar as mesmas mensagens de `errors.ts` e o mesmo link para `/settings/plan`.
- **Pagamento de plano ainda não está no front** — o backend já tem assinatura pelo Stripe (`/billing/*`, API.md § 23), mas o front não abre o checkout: escolher um plano pago devolve `PLAN_REQUIRES_CHECKOUT`, mostrado como "Este plano é pago. Assine pelo botão de pagamento." Não é uma limitação da API — falta implementar.
- **Membro sem nome de perfil** (conta antiga ou Google sem nome) aparece com o id abreviado; e-mail de outros membros não é exposto.
- **Sem exclusão de pasta** — apenas arquivamento. Itens vão para a lixeira (30 dias).
- **`useUnassignItemMutation` ainda limpa o responsável por `/sync/push`** — o backend agora aceita `assigneeId: null` (e `assigneeIds: []`) no `PATCH`, então isso pode ser simplificado.
- **Sync offline cobre poucos campos de item** — ver [Etapas, cronograma e lixeira](#etapas-cronograma-e-lixeira).
- **Prazo e prioridade de item, uma vez definidos, só podem ser substituídos por outro valor** — a API não oferece uma forma de removê-los depois de definidos.
- **Comentários e valores de custom field em itens não são versionados** (`version`) — sem base para concorrência otimista; por isso ficam parcialmente ou totalmente fora do fluxo de sincronização offline (ver [§10](#10-sincronização-offline)).
- **Gráficos de dashboard não têm períodos relativos** ("últimos 30 dias", "atrasadas agora") — um filtro de data num gráfico salvo guarda um timestamp fixo, calculado no cliente na hora de salvar; "últimos 7 dias" viraria silenciosamente "7 dias antes de quando o gráfico foi criado". Por isso o construtor só oferece intervalos fixos, exibidos como datas, e para atraso usa a métrica `overdue_rate`, que o servidor calcula no momento da consulta. Destrava quando a API aceitar datas relativas resolvidas na consulta (algo como `"value": "now-7d"`) — pedido já levado ao backend.
- **Reautenticação de ações críticas do assistente só aceita senha** — a API já reserva o campo `twoFactorCode` no body, mas rejeita sempre; o frontend nunca oferece essa opção. **Histórico de conversa do assistente não é persistido** em lugar nenhum (nem servidor, nem `localStorage`) — fecha o painel, perde a conversa, por design.
