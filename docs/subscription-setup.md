# Subscription Setup - Stripe Billing

Configuracao atual: **Stripe Checkout + webhooks** para pagamentos fora da loja. O app abre uma Stripe Checkout Session e o backend ativa/desativa o plano a partir dos eventos assinados da Stripe. O fluxo Google Play Billing continua disponivel no codigo para builds Android que precisem cumprir regras da Play Store.

Planos: **Essencial** e **Profissional**, cada um com preco mensal e anual (ver `docs/planos-comerciais.md`). Sao 4 Prices no total.

## Produtos

| Plano        | Periodo | Preco     | Stripe Price ID                        |
| ------------ | ------- | --------- | -------------------------------------- |
| Essencial    | Mensal  | R$ 29,90  | `STRIPE_PRICE_ESSENTIAL_MONTHLY_ID`    |
| Essencial    | Anual   | R$ 299,00 | `STRIPE_PRICE_ESSENTIAL_ANNUAL_ID`     |
| Profissional | Mensal  | R$ 69,90  | `STRIPE_PRICE_PROFESSIONAL_MONTHLY_ID` |
| Profissional | Anual   | R$ 699,00 | `STRIPE_PRICE_PROFESSIONAL_ANNUAL_ID`  |

## 1. Stripe Dashboard

1. Acesse Stripe Dashboard -> **Product catalog**.
2. Crie o produto **Lucro Caseiro Essencial** com dois Prices recorrentes: mensal R$ 29,90 e anual R$ 299,00.
3. Crie o produto **Lucro Caseiro Profissional** com dois Prices recorrentes: mensal R$ 69,90 e anual R$ 699,00.
4. Copie os quatro IDs `price_...` para as variaveis `STRIPE_PRICE_{ESSENTIAL,PROFESSIONAL}_{MONTHLY,ANNUAL}_ID`.
5. Use chaves `live` em producao e `test` em desenvolvimento.

## 2. Webhook

1. Acesse Stripe Dashboard -> **Developers** -> **Webhooks**.
2. Crie um endpoint para `https://<api>/api/v1/webhooks/stripe`.
3. Selecione `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted`.
4. Copie o signing secret `whsec_...` para `STRIPE_WEBHOOK_SECRET`.

O tier ativado vem da metadata `tier` gravada no checkout; se faltar, o backend casa o Price id com a config e, em ultimo caso, ativa `professional` (cobre assinaturas Premium legadas).

## 3. Variaveis

Backend (`apps/api/.env`):

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ESSENTIAL_MONTHLY_ID=price_...
STRIPE_PRICE_ESSENTIAL_ANNUAL_ID=price_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY_ID=price_...
STRIPE_PRICE_PROFESSIONAL_ANNUAL_ID=price_...
STRIPE_SUCCESS_URL=https://lucrocaseiro.app/checkout/success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=https://lucrocaseiro.app/checkout/cancel
```

Mobile/build:

```env
EXPO_PUBLIC_AUTH_REDIRECT_URL=lucrocaseiro://
```

No Supabase Auth, adicione `lucrocaseiro://` em **URL Configuration -> Redirect URLs** para login social.

## 4. Google Play (Android)

Crie assinaturas com os product ids: `lucrocaseiro_essential_monthly`, `lucrocaseiro_essential_annual`, `lucrocaseiro_professional_monthly`, `lucrocaseiro_professional_annual`. O backend deriva o tier pelo product id na verificacao do token (`/sync-plan`).

## 5. Testar

1. Crie os 4 Products/Prices recorrentes na Stripe (2 tiers x mensal/anual).
2. Configure o webhook da Stripe para `https://<api>/api/v1/webhooks/stripe`.
3. Inclua eventos `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted`.
4. No app, abra a paywall, escolha o plano/periodo e toque em assinar.
5. O checkout deve abrir pela Stripe.
6. Apos o pagamento, o webhook atualiza `users.plan` para `essential` ou `professional`.
7. Teste cancelamento/expiracao pelo painel Stripe e confirme o downgrade para `free`.

## Checklist

- [ ] 4 Products/Prices (Essencial/Profissional x mensal/anual) criados na Stripe
- [ ] `STRIPE_SECRET_KEY` no backend de producao
- [ ] `STRIPE_WEBHOOK_SECRET` no backend de producao
- [ ] Os 4 `STRIPE_PRICE_*_ID` configurados
- [ ] Product ids equivalentes criados no Google Play
- [ ] Webhook Stripe apontando para `/api/v1/webhooks/stripe`
- [ ] Compra teste ativa o plano correto (essential/professional)
- [ ] Cancelamento/expiracao desativa (volta para free)
