---
name: taskflow-web-screen
description: Monta a parte visível de uma funcionalidade no TaskFlow-frontend (Next.js 16 App Router + shadcn/ui) — página nova no grupo (dashboard), aba da pasta, item da sidebar, guarda por papel ou SUPER_ADMIN, formulário com react-hook-form + zod em pt-BR, primitivos via CLI do shadcn, largura de página, texto para público leigo e guia no /tutorial. Use sempre que o pedido for "nova página", "nova tela", "nova rota", "nova aba na pasta", "colocar no menu/sidebar", "formulário", "validação do formulário", "dialog/modal", "esconder botão para quem não pode", "página só para admin", "componente do shadcn", "texto da tela", "tutorial/guia", ou "deixar mais simples para o usuário leigo".
---

# Tela, rota, navegação e formulário

Referências: `src/app/(dashboard)/folders/[folderId]/(folder)/` (layout com abas + páginas),
`src/features/folders/components/folder-tabs-nav.tsx`, `src/components/layout/nav-items.ts`,
`src/features/folders/schemas.ts` + `create-folder-dialog.tsx` (formulário),
`src/components/shared/*`. "Porquê": `ARCHITECTURE.md` §4 (rotas e guards), §12 (UI), §13
(formulários), §14 (convenções), §11 "Tutorial". A árvore de rotas do §4 está desatualizada (não
mostra o grupo `(folder)` nem `folders/[folderId]/sections`) — confie em `find src/app -name page.tsx`.

**Antes de mexer em convenção do Next** (layouts, params, metadata, redirect, loading): leia o guia em
`node_modules/next/dist/docs/01-app/` — é Next 16, com APIs diferentes do que se costuma lembrar (`AGENTS.md`).

## Página / rota

1. Rota autenticada vai dentro de `src/app/(dashboard)/` (já tem `RequireAuth`,
   `CurrentWorkspaceProvider`, `SyncProvider`). Pública: fora do grupo (ex.: `src/app/forms/`).
2. `page.tsx` com `"use client"` que só compõe componentes da feature. Params:
   `export default function XPage(props: PageProps<"/rota/[id]">) { const { id } = use(props.params); ... }`
   (`PageProps`/`LayoutProps` são gerados: rode `npx next typegen` para o `tsc` enxergar a rota nova).
3. Índice que só redireciona: Server Component com `redirect()` (modelo `(folder)/page.tsx`).
4. Componente com estado local por id renderizado com `key={id}` (ex.: `<FolderStatsSection key={folderId} />`).
5. Largura: o layout limita a `max-w-7xl`. Tela que precisa de tudo marca `data-page-width="full"`;
   leitura/formulário estreita com `mx-auto max-w-3xl`.
6. Cabeçalho: `PageHeader` (`title`, `description` em uma frase simples, `actions`).

## Aba da pasta

Acrescente um objeto `{ href, label, hint }` em `tabs` de `folder-tabs-nav.tsx` (o `hint` é a
explicação de uma linha mostrada embaixo das abas — obrigatório para o público leigo) e a página em
`src/app/(dashboard)/folders/[folderId]/(folder)/<aba>/page.tsx`. Aba só para gestor segue o modelo
de `showAutomations` (prop vinda de `useFolderPermission(folderId).canManage` no layout).

## Item da sidebar

Entrada em `NAV_ITEMS` (`src/components/layout/nav-items.ts`): `href`, `label` pt-BR, ícone
`lucide-react`, `group` (`work`/`team`/`help`/`account`/`admin`, na ordem de frequência de uso).
Restrições: `workspacePermission: canX` (papel no workspace atual), `requiresSuperAdmin: true`,
`workspaceHref` para rotas sob o workspace atual.

## Guardas (sempre também na própria página)

Esconder o link não protege a URL. Papel no workspace: a página verifica com a regra de
`src/lib/permissions.ts` e mostra `EmptyState` "Acesso restrito" (modelo `/developers`).
SUPER_ADMIN: a página detecta o 403 do próprio endpoint e manda para `/403` (modelo
`features/admin/components/clients-table.tsx`, query com `retry: false`). Botões que o papel não
permite: `<RoleGate allowed={canX(role)}>`. Regra nova de papel → função em `permissions.ts` com
comentário citando a seção do `API.md`, e a mesma regra na matriz `features/tutorial/lib/tutorial-reference.ts`.

## Formulário

1. Schema zod em `src/features/<feature>/schemas.ts`, mensagens pt-BR no próprio schema, e o tipo
   `export type XFormValues = z.infer<typeof xSchema>`. Limites iguais aos do DTO do backend.
2. `useForm<XFormValues>({ resolver: zodResolver(xSchema), defaultValues })` + `Form`/`FormField`/
   `FormItem`/`FormLabel`/`FormControl`/`FormMessage` de `@/components/ui/form`.
3. Submit chama `mutation.mutate(values, { onSuccess: () => { form.reset(); onOpenChange(false); } })`;
   o toast e o erro já vêm do hook. Botão com `disabled={mutation.isPending}` e `Loader2` girando.
4. Regra cruzada entre campos (ex.: duração somando horas + minutos, "não pode terminar no futuro")
   vai num `superRefine` do schema com `path` no campo que mostra o erro — modelo em
   `features/time-tracking/schemas.ts`, com `toXRequest(values)` convertendo para o payload da API.

## Componentes e estilo

- Primitivo que falta: `npx shadcn add <componente>` (gera em `src/components/ui/`, não edite à mão).
- Antes de criar, procure em `src/components/shared/` (`PageHeader`, `EmptyState`, `ErrorState`,
  `ConfirmDialog`, `Pager`, `RoleGate`, `StatusBadge`, `MemberAvatar`...).
- Classes com `cn()` (`@/lib/utils`); cores pelos tokens (`text-muted-foreground`, `bg-muted`,
  `--success`), nunca hex solto. Gráfico categórico usa `--analytics-cat-1..6`, não `--chart-*`.
- Datas com `src/lib/format.ts` (date-fns pt-BR), nunca `toLocaleString` solto.

## Texto para público leigo

Frases curtas em pt-BR, dizendo o que a tela faz e o próximo passo. Sem ids, codes, enums crus nem
jargão ("endpoint", "payload"). Vocabulário: Folder = **pasta**, Item = **item**, Section = **coluna**
no quadro, status "A fazer / Em andamento / Concluída" (o mesmo texto do backend) (`ITEM_STATUS_LABEL`). Estado vazio sempre
diz como começar ("Use “Iniciar cronômetro” dentro de um item.").

## Tutorial

Funcionalidade nova visível → guia em `features/tutorial/lib/tutorial-guides.ts` (dado, não JSX:
`sections`, `faq`, `href`, `hrefLabel`) citando os rótulos reais da tela, e link
`<TutorialGuideLink>` na tela quando a explicação for longa. Elemento que entra no tour:
`data-tour="<id>"` + passo em `tour-steps.ts`.

## Checklist final

- [ ] Página em `(dashboard)` (ou pública fora dele), `"use client"`, `PageProps` + `use(params)`
- [ ] `npx next typegen` rodado; `tsc` enxerga a rota
- [ ] Aba com `hint` / item de sidebar no grupo certo, com as restrições de papel
- [ ] Guarda na própria página (acesso restrito ou 403), não só no link; `RoleGate` nos botões
- [ ] Formulário com zod (mensagens pt-BR, limites do DTO) + react-hook-form + componentes `Form`
- [ ] Primitivos via `npx shadcn add`; tokens de cor; datas por `format.ts`
- [ ] Texto leigo, vocabulário pasta/item/coluna, estado vazio com próximo passo
- [ ] Guia do tutorial (e matriz de papéis, se mudou permissão) atualizado
- [ ] Testado no navegador em claro e escuro, e em largura de celular
