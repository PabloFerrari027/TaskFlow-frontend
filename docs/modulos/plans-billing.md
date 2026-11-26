# Módulo plans / billing (frontend)

Estado atual. Contrato do backend: `TaskFlow-backend/API.md` §23 (planos, assinatura, cupons) e §24 (consumo de IA).

## O que o usuário vê

Página única **`/settings/billing`** ("Plano e cobrança"). `/settings/plan` só redireciona para ela, preservando a query string.

Ordem da página: `SubscriptionStatusCard` → `AssistantAllowanceCard` → *(ponto reservado para a seção de recarga de IA, ainda não implementada; ver o comentário em `page.tsx`)* → "Planos disponíveis" (`PlanPicker`, âncora `#planos`) → detalhes técnicos (consumo em tokens e histórico).

## Arquivos

| Arquivo | Papel |
|---|---|
| `src/types/plan.ts` | `Plan`, `MyPlan` (com `subscription`), `SubscriptionStatus`, `CheckoutResponse`, cupons |
| `features/plans/api/plans-service.ts` | `GET /plans`, `GET /plans/me`, `PATCH /plans/me` (**só plano gratuito**, sem cupom), preview de cupom, admin |
| `features/plans/api/billing-service.ts` | `startCheckout`, `changePlan`, `cancel`, `resume`, `openPortal` (`/billing/*`) |
| `features/plans/hooks/use-billing.ts` | Mutações de billing; checkout e portal fazem `window.location.assign(url)` |
| `features/plans/lib/subscription.ts` | `hasSubscriptionInForce` (ACTIVE/TRIALING/PAST_DUE), `hasSubscriptionEnded` |
| `features/plans/components/choose-plan-dialog.tsx` | Decide a ação ao escolher um plano (tabela abaixo) |
| `features/plans/components/subscription-status-card.tsx` | Status, desconto, banners e ações da assinatura |
| `features/plans/components/checkout-return-handler.tsx` | Retorno do Stripe (`?checkout=`) com polling |
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

A volta do Stripe não prova o pagamento: o plano só muda quando o webhook chega. `?checkout=success` mostra um toast "Confirmando o pagamento…" e consulta `GET /plans/me` a cada 2 s por até 30 s (`refetchInterval` do React Query) até haver plano pago com assinatura vigente; depois, toast de sucesso, ou aviso neutro se estourar os 30 s. `?checkout=cancel` mostra um toast neutro. A query string é limpa com `router.replace` logo no início, para um reload não repetir o aviso. O handler usa `useSearchParams`, então fica dentro de `<Suspense>` (Next 16). Decisão registrada no ADR 0001 (`docs/adr/`).

## Decisões e limites

- Cupom só vale para assinatura (decisões v1); o campo não aparece para plano gratuito.
- Sem notificação in-app de PAST_DUE: só o banner e os e-mails nativos do Stripe.
- O portal do Stripe deve ficar com a troca de plano desligada (a troca passa por `/billing/subscription/change`).
- Os envs `BILLING_*_URL` do backend devem apontar para o front (`/settings/billing`), não para a API.
- Recarga de IA: fora deste módulo por enquanto.
