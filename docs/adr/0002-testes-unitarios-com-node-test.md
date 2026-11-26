# 0002. Testes unitários com `node --test`, sem Vitest na v1

- **Status:** Proposto
- **Data:** 2026-11-26
- **Módulo:** plans-billing
- **PR:** feat/recarga-ia-front

## Contexto

O frontend não tinha runner de testes. A recarga de IA trouxe lógica pura que precisa de teste (formatação de créditos, confirmação do retorno do Stripe, validação de URL), mas sem DOM, mocks de módulo ou componentes.

## Decisão

- `npm run test:unit` roda `node --test "src/**/*.test.ts"`, com `node:test` e `node:assert/strict`. O Node (>= 22.18) executa TypeScript direto, sem build nem dependência nova.
- Os arquivos de teste e o código que eles importam usam imports relativos com extensão `.ts` (`allowImportingTsExtensions` já está ligado no `tsconfig.json`); o alias `@/` não resolve fora do bundler do Next.
- Requisito de ambiente: Node >= 22.18 (`engines` no `package.json`, `.nvmrc` com a 24).
- Vitest ficou de fora na v1: nada ainda precisa de jsdom, mocks de módulo ou testes de componente. Quando precisar, a migração é trocar o runner, porque os testes usam só `describe`/`it`/`assert`.

## Alternativas consideradas

- **Vitest:** ficou de fora na v1; nada ainda precisa de jsdom, mocks de módulo ou testes de componente.

## Consequências

- Zero dependências e CI simples, mas só dá para testar módulos puros e que não usem o alias `@/` nem imports de `.tsx`.
- Em Node 20 ou anterior, `test:unit` falha ao carregar os `.ts`; por isso o `engines`.

## Heurística de exibição: `CREDITS_PER_MESSAGE = 5`

O usuário vê créditos e "≈N mensagens", nunca tokens nem µUSD. A conversão usa `CREDITS_PER_MESSAGE = 5` (em `features/plans/lib/top-up.ts`), a razão entre o custo estimado de uma mensagem (`TOKENS_PER_MESSAGE`, em `plan-caps.ts`, que o servidor precifica em µUSD e o front nunca vê) e o valor de um crédito (decisões v1: reaproveitar a heurística do front). É só exibição: o servidor debita o custo real de cada chamada, então o número é uma estimativa ("≈") e pode mudar sem migração de dados. Se o custo estimado mudar, ajusta-se a constante.
