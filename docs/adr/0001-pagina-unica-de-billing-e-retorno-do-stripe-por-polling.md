# 0001. Página única de billing e retorno do Stripe por polling

- **Status:** Proposto
- **Data:** 2026-11-26
- **Módulo:** plans-billing
- **PR:** feat/billing-assinatura
- **Detalhes do módulo:** [plans-billing](../modulos/plans-billing.md)

## Contexto

Plano, assinatura, cupom e cobrança estavam espalhados entre `/settings/plan` e telas soltas. Além disso, a volta do Stripe Checkout (`?checkout=success`) não prova o pagamento: o plano só muda quando o webhook do Stripe chega ao backend, o que pode levar alguns segundos.

## Decisão

- Uma única página, `/settings/billing` ("Plano e cobrança"), concentra plano atual, status da assinatura, escolha de plano e cobrança. `/settings/plan` só redireciona para ela, preservando a query string, para não quebrar links, e-mails e os `BILLING_*_URL` já configurados.
- No retorno do Stripe, o front consulta `GET /plans/me` a cada 2 s por até 30 s (`refetchInterval` do React Query), até haver plano pago com assinatura vigente. Depois mostra sucesso ou, ao estourar o prazo, um aviso neutro. A query string é limpa logo no início para um reload não repetir o aviso.
- Ao voltar pelo Back do navegador (bfcache), o diálogo de escolha é destravado e fechado (`useBfcacheRestore`).

## Alternativas consideradas

- **Websocket ou SSE para saber do pagamento:** descartados por exigirem infraestrutura nova para um ganho pequeno.

## Consequências

- Um só lugar para manter a UI de cobrança; links antigos continuam funcionando.
- O usuário pode ver "confirmando o pagamento" por alguns segundos; se o webhook demorar mais de 30 s, a tela avisa e o plano aparece no próximo carregamento.
- Polling custa uma requisição leve a cada 2 s, só durante o retorno. 
