# 0004. Só navegar para URLs https do Stripe

- **Status:** Proposto
- **Data:** 2026-11-26
- **Módulo:** plans-billing
- **PR:** feat/recarga-ia-front

## Contexto

As URLs do checkout e do portal vêm de respostas da API e iam direto para uma navegação completa do navegador (`window.location.assign`).

## Decisão

- `isStripeUrl` aceita só protocolo `https:` e host terminando em `.stripe.com`.
- `goToStripe` (`src/lib/navigation.ts`) lança erro se a URL não passar; a mutation termina em estado de erro em vez de navegar. Assinatura, portal e recarga usam o mesmo helper.
- A validação tem testes unitários (`stripe-url.test.ts`).

## Alternativas consideradas

- Nenhuma alternativa foi registrada nos relatórios; a correção veio da revisão final.

## Consequências

- **Positivas:** uma resposta inesperada da API não redireciona o usuário para fora do Stripe.
- **Negativas / trade-offs:** se o Stripe passar a servir páginas de outro domínio, a lista precisa ser atualizada.
