---
name: taskflow-web-api-contract
description: Mantém o TaskFlow-frontend alinhado ao contrato da API do backend — tipos em src/types espelhando os DTOs do API.md, a union ErrorCode e as mensagens pt-BR de ERROR_MESSAGES (com um script que compara os codes do backend com os do front), rótulos de enum para leigos e limitações "herdadas da API" que deixaram de valer. Use sempre que o pedido for "o backend mudou", "alinhar com o API.md", "campo novo na resposta", "tipo desatualizado", "code de erro novo", "mensagem de erro em inglês aparecendo", "erro sem tradução", "enum novo", "status novo", "o backend agora expõe X", ou antes de consumir um endpoint que ainda não tem tipo no front.
---

# Contrato front ↔ API

Fonte da verdade: `API.md` e o código do backend em `C:\Users\Pablo\Projects\TaskFlow-backend`
(DTOs em `src/modules/*/application/dtos`, codes em `src/shared/filters/domain-exception.filter.ts`).
No front: `src/types/*.ts` (1:1 com os DTOs), `src/types/common.ts` (`ErrorCode`, `PaginatedResult`,
`isDomainError`), `src/lib/errors.ts` (`ERROR_MESSAGES`, `getErrorMessage`, `getErrorCode`).
"Porquê": `ARCHITECTURE.md` §3 e §9.

## Passos

1. **Veja o que mudou no backend** desde a última sincronia:
   ```bash
   git -C /c/Users/Pablo/Projects/TaskFlow-backend log --oneline -15 -- API.md
   git -C /c/Users/Pablo/Projects/TaskFlow-backend diff <commit>..HEAD -- API.md
   ```
   Leia a seção do endpoint inteira (body, resposta, codes, 🔒/📄/⚡), não só o diff.

2. **Tipos** (`src/types/<recurso>.ts`): campo novo da resposta entra com a mesma opcionalidade
   que a API manda (`?` se pode faltar, `| null` se vem `null`); datas como `string`. Campo que o
   front marcava como "ainda não exposto pelo backend" (ex.: `name?: string | null` em
   `src/types/workspace.ts`) vira o tipo real quando o backend passar a mandar.

3. **Codes de erro**: rode da raiz do front
   ```bash
   node .claude/skills/taskflow-web-api-contract/scripts/check-error-codes.mjs
   ```
   (backend padrão em `~/Projects/TaskFlow-backend`; `--backend <path>` ou `TASKFLOW_BACKEND` para outro).
   Para cada code em **MISSING**: acrescente à union `ErrorCode` (`src/types/common.ts`) e a
   mensagem em `ERROR_MESSAGES` (`src/lib/errors.ts`). O `Record<ErrorCode, string>` faz o `tsc`
   cobrar a mensagem. "Only in the frontend" é aceitável quando a API emite o code fora do filtro
   (`REQUEST_TIMEOUT`, `INTERNAL_ERROR`); senão é resto a limpar.

4. **Texto das mensagens** (público leigo): pt-BR curto, diz o que aconteceu e o que fazer
   ("O código expirou. Solicite um novo código."), sem o code, sem id, sem termo técnico.
   Mesmo code com sentidos diferentes por tela → trate na tela com `getErrorCode(error)`, não
   mude a mensagem genérica. Um code que pede ação especial (ex.: `EMAIL_NOT_VERIFIED` → redireciona,
   `TOKEN_QUOTA_EXCEEDED` → link para `/settings/plan`) é tratado com `getErrorCode` no componente.

5. **Enums novos ou valores novos**: todo enum mostrado ao usuário tem um mapa de rótulo
   `Record<Enum, string>` (ex.: `ITEM_STATUS_LABEL` em `src/components/shared/status-badge.tsx`).
   Adicionar o valor à union obriga o `tsc` a cobrar o rótulo. Nunca renderize o valor cru.
   Se o mesmo enum tem rótulo no backend (texto do assistente em
   `backend/src/modules/actions/application/catalogs/item-actions.ts`), use o MESMO texto.

6. **Limitações que caíram**: procure a funcionalidade em `ARCHITECTURE.md` §15 e
   `README.md` ("Limitações conhecidas") e em comentários "the API doesn't expose..." no código
   (`grep -rniE "doesn't expose|não expõe|until the backend|never a name" src` — os nomes de membros, que eram o caso
   mais antigo, já foram resolvidos). Se o backend agora oferece,
   ajuste o código e apague a limitação da doc.

7. **Verifique**: `npx next typegen && npx tsc --noEmit` (pega todo uso quebrado pelo tipo novo) e
   rode o script de novo até sair `OK`.

## Checklist final

- [ ] Seção do `API.md` lida inteira; tipos em `src/types` com a mesma opcionalidade/nulabilidade
- [ ] Script de codes sem MISSING; cada code novo com mensagem pt-BR leiga
- [ ] Codes que pedem ação especial tratados com `getErrorCode` na tela certa
- [ ] Valor de enum novo com rótulo no mapa `*_LABEL` (mesmo texto do backend quando existir)
- [ ] Limitações que deixaram de valer removidas da doc e do código
- [ ] `tsc` limpo depois de `next typegen`
