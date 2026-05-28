# Subscription Setup - Stripe Billing

Configuracao atual: **Stripe Checkout + webhooks** para pagamentos fora da loja. O app abre uma Stripe Checkout Session e o backend ativa/desativa Premium a partir dos eventos assinados da Stripe. O fluxo Google Play Billing continua disponivel no codigo para builds Android que precisem cumprir regras da Play Store.

## Produtos

| Plano  | Preco     | Stripe Price ID           |
| ------ | --------- | ------------------------- |
| Mensal | R$ 14,90  | `STRIPE_PRICE_MONTHLY_ID` |
| Anual  | R$ 119,90 | `STRIPE_PRICE_ANNUAL_ID`  |

## 1. Stripe Dashboard

1. Acesse Stripe Dashboard -> **Product catalog**.
2. Crie o produto **Lucro Caseiro Premium**.
3. Crie um Price recorrente mensal de R$ 14,90.
4. Crie um Price recorrente anual de R$ 119,90.
5. Copie os IDs `price_...` para `STRIPE_PRICE_MONTHLY_ID` e `STRIPE_PRICE_ANNUAL_ID`.
6. Use chaves `live` em producao e `test` em desenvolvimento.

## 2. Webhook

1. Acesse Stripe Dashboard -> **Developers** -> **Webhooks**.
2. Crie um endpoint para `https://<api>/api/v1/webhooks/stripe`.
3. Selecione `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted`.
4. Copie o signing secret `whsec_...` para `STRIPE_WEBHOOK_SECRET`.

## 3. Variaveis

Backend (`apps/api/.env`):

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY_ID=price_...
STRIPE_PRICE_ANNUAL_ID=price_...
STRIPE_SUCCESS_URL=https://lucrocaseiro.app/checkout/success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=https://lucrocaseiro.app/checkout/cancel
```

Mobile/build:

```env
EXPO_PUBLIC_AUTH_REDIRECT_URL=lucrocaseiro://
```

No Supabase Auth, adicione `lucrocaseiro://` em **URL Configuration -> Redirect URLs** para login social.

## 4. Testar

1. Crie Products/Prices recorrentes na Stripe para mensal e anual.
2. Configure o webhook da Stripe para `https://<api>/api/v1/webhooks/stripe`.
3. Inclua eventos `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted`.
4. No app, abra a paywall e toque em assinar.
5. O checkout deve abrir pela Stripe.
6. Apos o pagamento, o webhook atualiza `users.plan = premium`.
7. Teste cancelamento/expiracao pelo painel Stripe e confirme o downgrade.

## Checklist

- [ ] Products/Prices mensais/anuais criados na Stripe
- [ ] `STRIPE_SECRET_KEY` no backend de producao
- [ ] `STRIPE_WEBHOOK_SECRET` no backend de producao
- [ ] `STRIPE_PRICE_MONTHLY_ID` e `STRIPE_PRICE_ANNUAL_ID` configurados
- [ ] Webhook Stripe apontando para `/api/v1/webhooks/stripe`
- [ ] Compra teste ativa Premium
- [ ] Cancelamento/expiracao desativa Premium
