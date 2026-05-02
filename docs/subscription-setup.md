# Subscription Setup — Lucro Caseiro Premium

Guia passo-a-passo para configurar a assinatura Premium nas 3 plataformas: App Store Connect, Google Play Console e RevenueCat.

> **Lancamento Android-first:** o plano e publicar no Google Play primeiro (review ~2-3 dias) e adicionar iOS depois. Siga apenas as secoes 2 (Play Console) e 3 (RevenueCat) agora. A secao 1 (App Store Connect) fica para o lancamento iOS futuro.

## Produtos

| ID                             | Tipo   | Preco     | Trial  |
| ------------------------------ | ------ | --------- | ------ |
| `lucrocaseiro_premium_monthly` | Mensal | R$ 14,90  | 7 dias |
| `lucrocaseiro_premium_annual`  | Anual  | R$ 119,90 | 7 dias |

Entitlement unico: **`premium`** (libera todos os recursos Premium).

---

## 1. App Store Connect (iOS)

1. Acesse [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → seu app → **Features** → **In-App Purchases and Subscriptions**.
2. **Create Subscription Group:** nome interno `premium_group`, display `Lucro Caseiro Premium`.
3. Dentro do grupo, crie 2 subscriptions (Auto-Renewable):

   **Monthly**
   - Reference Name: `Premium Monthly`
   - Product ID: `lucrocaseiro_premium_monthly`
   - Duration: 1 Month
   - Price: R$ 14,90 (Brazil tier correspondente)
   - Localization (pt-BR): Display Name `Premium Mensal`, Description curta (ex.: "Vendas, clientes e receitas ilimitadas")
   - Introductory Offer → Free Trial → 7 days

   **Annual**
   - Reference Name: `Premium Annual`
   - Product ID: `lucrocaseiro_premium_annual`
   - Duration: 1 Year
   - Price: R$ 119,90
   - Localization (pt-BR): Display Name `Premium Anual`
   - Introductory Offer → Free Trial → 7 days

4. Para cada produto: subir screenshot do paywall (1024x1024 ou 640x920 iPhone).
5. Em **App Information** → configurar **Paid Apps Agreement** e **Tax/Banking**.
6. Status dos produtos ficara **Ready to Submit** — envie junto com a proxima build.

## 2. Google Play Console (Android)

1. Acesse [play.google.com/console](https://play.google.com/console) → app → **Monetize** → **Products** → **Subscriptions**.
2. **Create subscription:**
   - Product ID: `lucrocaseiro_premium_monthly`
   - Name: `Premium Mensal`
   - Base plan: auto-renovavel, periodo **Monthly**, preco R$ 14,90
   - Offer: Free trial de 7 dias (eligibilidade: first-time subscribers)
3. Repetir para `lucrocaseiro_premium_annual` (periodo Yearly, preco R$ 119,90).
4. Ativar ambos os produtos.
5. **Setup → Monetization setup** → vincular conta de pagamento.

## 3. RevenueCat

1. Criar conta gratuita em [app.revenuecat.com](https://app.revenuecat.com).
2. **New Project** → `Lucro Caseiro`.
3. **Apps** → adicionar:
   - **iOS App** — bundle ID `com.lucrocaseiro.app`, subir In-App Purchase Key (.p8) do App Store Connect
   - **Android App** — package `com.lucrocaseiro.app`, subir Service Account JSON do Google Play
4. **Entitlements** → criar `premium`.
5. **Products** → importar os 4 produtos (2 iOS + 2 Android). Vincular todos ao entitlement `premium`.
6. **Offerings** → criar offering `default` → marcar como **Current**:
   - Package `$rc_monthly` → apontar para ambos os `lucrocaseiro_premium_monthly`
   - Package `$rc_annual` → apontar para ambos os `lucrocaseiro_premium_annual`
7. **API Keys** (em Project Settings → API Keys):
   - Copiar **Apple App Store Public API Key** (`appl_...`)
   - Copiar **Google Play Public API Key** (`goog_...`)
8. **Integrations → Webhooks:**
   - URL: `https://<SEU_DOMINIO_API>/api/v1/webhooks/revenuecat`
   - Authorization Header: `Bearer <REVENUECAT_WEBHOOK_SECRET>` (gerar string aleatoria e guardar)

## 4. Variaveis de ambiente

### Backend (`apps/api/.env`)

```env
REVENUECAT_WEBHOOK_SECRET=<string_aleatoria_usada_no_webhook>
```

Deploy: adicionar a mesma variavel no host (Railway/Fly/Vercel/etc).

### Mobile

As keys publicas entram em [apps/mobile/app.json](../apps/mobile/app.json) em `expo.extra.revenuecat`:

```json
"revenuecat": {
  "iosKey": "appl_XXXXXXXX",
  "androidKey": "goog_XXXXXXXX",
  "entitlementId": "premium"
}
```

Keys publicas da RevenueCat podem ficar commitadas (sao publicas por design — a validacao e server-side via webhook secret). Se preferir esconder do repo, migre `app.json` para `app.config.ts` e leia `process.env.REVENUECAT_IOS_KEY` via `eas secret:create`.

## 5. Testar

### iOS Sandbox

1. App Store Connect → Users and Access → **Sandbox Testers** → criar tester.
2. No device iOS: Settings → App Store → Sandbox Account → logar com tester.
3. Build dev (`eas build --profile development --platform ios`) e testar fluxo de compra.

### Android Internal Testing

1. Play Console → Testing → Internal testing → adicionar conta de teste.
2. Build dev (`eas build --profile development --platform android`) e testar.

### Webhook

- RevenueCat dashboard → Integrations → Webhooks → **Send Test Event** — deve retornar 200.
- Verificar logs do backend para evento `TEST`.

## 6. Mercado Pago (alternativa PIX/cartao via web)

Metodo **opcional** paralelo ao RevenueCat. Util pro publico brasileiro que prefere PIX ou nao quer cadastrar cartao na conta Google. Taxa de ~4,99% (vs 15% Apple/Google).

### Criar Preapproval Plans

1. Acesse [mercadopago.com.br/developers/panel/app](https://www.mercadopago.com.br/developers/panel/app) → criar app `Lucro Caseiro`.
2. **Activities & integrations** → **Subscriptions (preapproval)** → ativar.
3. Criar 2 planos via API (precisa de access token):

   ```bash
   # Plano Mensal
   curl -X POST https://api.mercadopago.com/preapproval_plan \
     -H "Authorization: Bearer <ACCESS_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{
       "reason": "Lucro Caseiro Premium Mensal",
       "auto_recurring": {
         "frequency": 1,
         "frequency_type": "months",
         "transaction_amount": 14.90,
         "currency_id": "BRL"
       },
       "back_url": "https://lucrocaseiro.app/payment-return",
       "payment_methods_allowed": {
         "payment_types": [{"id": "credit_card"}, {"id": "ticket"}],
         "payment_methods": [{"id": "pix"}]
       }
     }'

   # Plano Anual — repetir com transaction_amount: 119.90, frequency: 1, frequency_type: "years"
   ```

4. Anote os `id` retornados (ex: `2c93808489...`).

### Configurar webhook

1. Painel MP → **Webhooks** → criar:
   - URL: `https://<API>/api/v1/webhooks/mercadopago`
   - Eventos: `subscription_preapproval`, `subscription_authorized_payment`
   - Modo: **Producao**
2. Copiar o **Secret** gerado pelo MP (sera usado em `MERCADOPAGO_WEBHOOK_SECRET`).

### Variaveis de ambiente (backend)

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=<secret_gerado_no_painel>
MERCADOPAGO_PLAN_MONTHLY_ID=<id_do_plano_mensal>
MERCADOPAGO_PLAN_ANNUAL_ID=<id_do_plano_anual>
```

### Testar

1. Sandbox: usar `TEST-xxxxx` access token + cartao de teste documentado em [mercadopago.com.br/developers/pt/docs/checkout-pro/test-integration](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/test-integration).
2. App → Paywall → "Pagar com PIX ou cartao" → abre browser do MP → completar pagamento.
3. Painel MP → Webhooks → **Send Test Event** → conferir log da API.
4. Checar `users.plan` no banco apos compra de teste — deve estar `premium`.

---

## 7. Checklist de Lancamento

### RevenueCat (Apple/Google IAP)

- [ ] Produtos criados em App Store Connect (status "Ready to Submit")
- [ ] Produtos criados em Google Play Console (status "Active")
- [ ] Paid Apps Agreement aceito (Apple) e conta bancaria vinculada (Google)
- [ ] RevenueCat com offering `default` marcada como Current
- [ ] Webhook RevenueCat → backend retornando 200
- [ ] `REVENUECAT_WEBHOOK_SECRET` no backend de producao
- [ ] `iosKey` e `androidKey` preenchidas em `app.json`
- [ ] Teste de compra sandbox iOS → entitlement ativo
- [ ] Teste de compra internal Android → entitlement ativo
- [ ] Teste de restore em conta ja paga
- [ ] Teste de cancelamento → webhook EXPIRATION → `plan: free`

### Mercado Pago (opcional)

- [ ] Conta MP com KYC completo + dados bancarios
- [ ] Preapproval plans criados (mensal + anual)
- [ ] Webhook configurado com URL de producao
- [ ] `MERCADOPAGO_*` envs no backend de producao
- [ ] Teste sandbox: assinatura ativa premium via webhook
- [ ] Teste de cancelamento via painel MP → webhook desativa premium
