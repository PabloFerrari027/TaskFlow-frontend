# Módulo plans / billing (frontend)

Estado atual. Contrato do backend: `TaskFlow-backend/API.md` §23 (planos, assinatura, cupons) e §24 (consumo de IA).

## O que o usuário vê

Página única **`/settings/billing`** ("Plano e cobrança"). `/settings/plan` só redireciona para ela, preservando a query string.

Ordem da página: `SubscriptionStatusCard` → `AssistantAllowanceCard` → `AiTopUpSection` ("Recarga de IA", âncora `#recarga`) → "Planos disponíveis" (`PlanPicker`, âncora `#planos`) → detalhes técnicos (consumo em tokens e histórico).

## Arquivos

| Arquivo | Papel |
|---|---|
| `src/types/plan.ts` | `Plan`, `MyPlan` (com `subscription`), `SubscriptionStatus`, `CheckoutResponse`, cupons |
| `features/plans/api/plans-service.ts` | `GET /plans`, `GET /plans/me`, `PATCH /plans/me` (**só plano gratuito**, sem cupom), preview de cupom, admin |
| `features/plans/api/billing-service.ts` | `startCheckout`, `changePlan`, `cancel`, `resume`, `openPortal` (`/billing/*`) |
| `features/plans/hooks/use-billing.ts` | Mutações de billing; checkout e portal navegam por `goToStripe(url)` (valida a URL, ver ADR 0004) |
| `features/plans/lib/subscription.ts` | `hasSubscriptionInForce` (ACTIVE/TRIALING/PAST_DUE), `hasSubscriptionEnded` |
| `features/plans/components/choose-plan-dialog.tsx` | Decide a ação ao escolher um plano (tabela abaixo) |
| `features/plans/components/subscription-status-card.tsx` | Status, desconto, banners e ações da assinatura |
| `features/plans/hooks/use-payment-return.ts` | Retorno do Stripe (`?<param>=success|cancel`): limpa a query, polling de 2 s por até 30 s e toast; compartilhado pela assinatura e pela recarga |
| `features/plans/components/checkout-return-handler.tsx` | Config do retorno da assinatura (`?checkout=`) |
| `features/plans/api/ai-top-ups-service.ts` | Recarga: packs, checkout, saldo/compras e CRUD admin de pacotes |
| `features/plans/hooks/use-ai-top-ups.ts` | Cota (`GET /ai-usage/me/quota`), packs, saldo, checkout e mutações admin |
| `features/plans/lib/top-up.ts` | Créditos inteiros, "≈N mensagens" (`CREDITS_PER_MESSAGE`), `describePack` |
| `features/plans/components/ai-top-up-section.tsx` | Seção "Recarga de IA": saldo, expiração, compras paginadas, botão comprar |
| `features/plans/components/buy-top-up-dialog.tsx` | Lista pacotes e abre o Stripe Checkout (usado na página e no chat) |
| `src/lib/use-bfcache-restore.ts` | Hook que reage à página restaurada do cache de ida e volta (bfcache) |
| `features/plans/components/top-up-return-handler.tsx` | Retorno `?topUp=` |
| `features/plans/components/ai-top-up-packs-table.tsx`, `ai-top-up-pack-form-dialog.tsx` | Aba "Pacotes de recarga" em `/admin/plans` |
| `features/developers/lib/api-reference/billing.ts` | Referência de API para desenvolvedores (contrato atual) |

## Regra do `ChoosePlanDialog`

| Plano escolhido | Assinatura | Ação |
|---|---|---|
| Gratuito | nenhuma vigente | `PATCH /plans/me` |
| Gratuito | ACTIVE/TRIALING/PAST_DUE | Não age: orienta cancelar (link para `/settings/billing`) |
| Pago | nenhuma vigente (nunca assinou, encerrada, INCOMPLETE) | `POST /billing/checkout` (+ cupom) e redirect ao Stripe |
| Pago | ACTIVE/TRIALING/PAST_DUE | `POST /billing/subscription/change` (+ cupom); aviso de que o upgrade cobra o rateio na hora e o downgrade vira crédito |

O cupom é conferido antes por `POST /plans/coupons/preview` (nada é reservado). Erros `COUPON_*` aparecem inline no campo, nunca em toast.

## Estados da assinatura (banners)

- **PAST_DUE**: plano continua valendo; banner pede para atualizar o cartão (abre o portal).
- **`cancelAtPeriodEnd`**: "termina em DD/MM" + botão Retomar (o cancelamento não aparece de novo).
- **Encerrada** (UNPAID, CANCELED, INCOMPLETE_EXPIRED, PAUSED): "sua assinatura terminou" + Assinar de novo (leva a `#planos`).
- **INCOMPLETE**: "pagamento pendente" + verificar de novo.
- Cancelar exige confirmação (`ConfirmDialog`); vale até o fim do período pago, sem reembolso proporcional.

## Retorno do Stripe e polling

A volta do Stripe não prova o pagamento: o plano só muda quando o webhook chega. `?checkout=success` mostra um toast "Confirmando o pagamento…" e consulta `GET /plans/me` a cada 2 s por até 30 s (`refetchInterval` do React Query) até haver plano pago com assinatura vigente; depois, toast de sucesso, ou aviso neutro se estourar os 30 s. `?checkout=cancel` mostra um toast neutro. A query string é limpa com `router.replace` logo no início, para um reload não repetir o aviso. O handler usa `useSearchParams`, então fica dentro de `<Suspense>` (Next 16). 

**Voltar pelo botão Voltar do navegador (bfcache).** Quem sai para o Stripe e volta pelo Voltar recebe a página exatamente como a deixou, sem nova montagem. Por isso `ChoosePlanDialog` escuta `pageshow` com `persisted` (`useBfcacheRestore`), zera a mutação de checkout e fecha o diálogo, em vez de ficar travado no estado de sucesso.

**Cache de uso de IA.** Trocar de plano (`POST /billing/subscription/change`) invalida o prefixo `queryKeys.aiUsage.root()` (`["ai-usage","me"]`), para o uso e o limite do assistente serem relidos.

## Limites e regras

- Cupom só vale para assinatura (decisões v1); o campo não aparece para plano gratuito.
- Sem notificação in-app de PAST_DUE: só o banner e os e-mails nativos do Stripe.
- O portal do Stripe deve ficar com a troca de plano desligada (a troca passa por `/billing/subscription/change`).
- Os envs `BILLING_*_URL` do backend devem apontar para o front (`/settings/billing`), não para a API.

## Decisões

- [0001 — Página única de billing e retorno do Stripe por polling](../adr/0001-pagina-unica-de-billing-e-retorno-do-stripe-por-polling.md)
- [0002 — Testes unitários com `node --test` e `CREDITS_PER_MESSAGE`](../adr/0002-testes-unitarios-com-node-test.md)
- [0003 — Confirmar a recarga pelo `purchaseId` guardado no `sessionStorage`](../adr/0003-confirmar-recarga-pelo-purchase-id.md)
- [0004 — Só navegar para URLs https do Stripe](../adr/0004-validar-a-url-do-stripe-antes-de-navegar.md)

## Recarga de IA

Contrato: `specs/contratos-recarga.md` §5 e §6; decisões em `specs/decisoes-v1.md`. Nome interno "recarga"/`AiTopUp*`: nunca "credits" em estado novo, porque `creditsExhausted`/`AI_INSUFFICIENT_CREDITS` significam que o provedor ficou sem saldo.

- **Unidade:** créditos inteiros (1 crédito = 1.000 µUSD no servidor), "≈N mensagens" por `CREDITS_PER_MESSAGE` (só exibição) e preço em R$. O usuário comum nunca vê µUSD nem tokens.
- **Quando mostrar o botão:** só com `GET /ai-usage/me/quota` → `topUp.purchasable`. Sem isso a seção mostra o saldo (se houver) e um aviso, ou some (flag desligada ou nada a mostrar).
- **Compra:** `BuyTopUpDialog` → `POST /billing/ai-top-ups/checkout` → redirect ao Stripe (só cartão). Os créditos só entram pelo webhook. Se o usuário voltar pelo Voltar do navegador (bfcache), o diálogo é destravado (`useBfcacheRestore`).
- **URL do Stripe:** o redirect só acontece para `https` em host `*.stripe.com` (`isStripeUrl`/`goToStripe`); qualquer outra URL vira erro da mutation, sem navegar (vale também para assinatura e portal).
- **Retorno:** `?topUp=success` faz polling de `GET /billing/ai-top-ups/me` (página 1, 2 s, até 30 s) até a compra aparecer na lista. `/me` só traz compras pagas (nunca `PENDING`/`EXPIRED`), então o front guarda o `purchaseId` do checkout no `sessionStorage` e confirma quando esse id é listado; sem o id, compara com a primeira leitura (saldo diferente ou `meta.total` maior). O id é apagado ao confirmar, cancelar ou expirar o prazo. Ao confirmar, invalida a cota. `?topUp=cancel` mostra toast neutro. A lógica é a mesma da assinatura (`usePaymentReturn`).
- **Card de uso:** `AssistantAllowanceCard` mostra "+N créditos de recarga (os próximos vencem em DD/MM)" quando há saldo.
- **Chat:** depois de `TOKEN_QUOTA_EXCEEDED`, "Comprar créditos" aparece se e só se `topUp.purchasable`; senão, o texto atual e "Ver planos". `AI_INSUFFICIENT_CREDITS` nunca mostra compra. Saldo maior que o da hora do 429 libera o aviso.
- **Admin:** aba "Pacotes de recarga" em `/admin/plans` (listar, criar, editar, ativar/desativar; preço digitado em R$ e enviado em centavos via `parsePriceInput`). A concessão manual de créditos é só API na v1, sem tela.
- **Testes:** `npm run test:unit` (`node --test`, ver ADR 0002) exige Node >= 22.18; o `.nvmrc` fixa a 24.
- **Limites:** `CREDITS_PER_MESSAGE` é uma heurística do front; o contrato garante `createdAt` DESC em `/me`.
