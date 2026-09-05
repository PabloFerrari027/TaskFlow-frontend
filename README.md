# TaskFlow — Frontend

Frontend do TaskFlow (Next.js App Router, TypeScript, Tailwind, shadcn/ui, TanStack Query) implementado contra a API descrita em `API.md`.

## Rodando localmente

Pré-requisito: a API do TaskFlow rodando (por padrão em `http://localhost:3000` — veja `API.md`). Como a API e este frontend usam a mesma porta por padrão, rode o frontend em outra porta, por exemplo:

```bash
npm install
npm run dev -- -p 3001
```

Configure `.env.local` (copie de `.env.local.example`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=   # opcional — login com Google fica oculto se vazio
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run lint` — ESLint

## Arquitetura

Feature-first / vertical slice: `src/features/<domínio>/{api,hooks,components,schemas}`. Fluxo de dados: Componente → hook do TanStack Query → serviço → `src/lib/api/client.ts` (axios) → API. Componentes de UI nunca chamam a API diretamente.

- `src/app` — rotas (App Router)
- `src/features` — auth, sessions, workspaces, projects, tasks, custom-fields, invitations
- `src/components/ui` — primitivos shadcn/ui
- `src/components/{layout,marketing,shared}` — composições reutilizáveis
- `src/lib` — cliente HTTP, autenticação/tokens, permissões, mapeamento de erros
- `src/types` — tipos alinhados 1:1 aos DTOs de `API.md`

## Limitações conhecidas (vêm da própria API)

- Não há endpoint de perfil do usuário autenticado — nome/e-mail exibidos vêm da decodificação do JWT.
- Membros de workspace/projeto expõem apenas `userId`, sem nome ou e-mail.
- Não há exclusão de projeto/tarefa — apenas arquivamento (projeto) e mudança de status (tarefa).
