# 0003. Confirmar a recarga pelo `purchaseId` guardado no `sessionStorage`

- **Status:** Proposto
- **Data:** 2026-11-26
- **Módulo:** plans-billing
- **PR:** feat/recarga-ia-front

## Contexto

Ao voltar do Stripe (`?topUp=success`), o front precisa saber quando o webhook creditou a compra. `GET /billing/ai-top-ups/me` lista só compras pagas, nunca `PENDING` nem `EXPIRED` (API.md §46). Quem já tinha comprado antes veria uma compra paga no topo da lista antes de o webhook chegar, e a confirmação sairia falsa (achado crítico da revisão final).

## Decisão

- O checkout devolve o `purchaseId`; o front o guarda no `sessionStorage` (com `try/catch`) assim que o checkout responde.
- No retorno, a compra é confirmada quando esse id aparece em `purchases.data` de `/me`.
- Sem o id (storage bloqueado, outra aba), o front compara com a primeira leitura depois do retorno: saldo diferente ou `meta.total` maior.
- O id é apagado ao confirmar, cancelar ou estourar os 30 s.

## Alternativas consideradas

- **Confirmar pela compra mais recente deixar de ser `PENDING`:** não funciona, porque `/me` nunca lista `PENDING`.

## Consequências

- **Positivas:** sem confirmação falsa para comprador recorrente; teste unitário cobre o cenário "compra repetida".
- **Negativas / trade-offs:** o id vale só na mesma aba; fora dela vale o fallback por comparação, menos preciso (um saldo que mude por outro motivo no intervalo pode confirmar antes da hora).
