# ai.context.api.md — Payments

---

## Purpose

Integracao alternativa de pagamento via **Mercado Pago** para usuarios que preferem PIX/boleto/cartao via web (fluxo paralelo ao RevenueCat). Gera URL de checkout para Preapproval Plans (assinaturas recorrentes) e processa webhooks do Mercado Pago para ativar/desativar Premium.

## Non-goals

- Nao gerencia o estado do plano (delega para `subscription.usecases.ts` via `activatePremium`/`deactivatePremium`)
- Nao processa cartao diretamente (sem PCI scope — checkout acontece no MP)
- Nao registra historico de pagamentos (estado e derivado do Mercado Pago)
- Nao substitui RevenueCat — ambos coexistem; webhook decide ativacao por evento recebido
- Nao cria os Preapproval Plans em si (sao criados manualmente no painel MP)

## Boundaries & Ownership

- **Depende de:**
  - `features/subscription/subscription.usecases.ts` (`activatePremium`, `deactivatePremium`)
  - `shared/middleware/auth` (apenas no checkout endpoint; webhook nao usa auth, valida por HMAC)
  - Mercado Pago REST API (`https://api.mercadopago.com`)
- **Dependentes:**
  - Mobile chama `POST /api/v1/payments/mercadopago/checkout` para obter URL e abrir no browser
  - Webhook do MP aponta para `POST /api/v1/webhooks/mercadopago`

## Code pointers

| Arquivo                        | Descricao                                                     |
| ------------------------------ | ------------------------------------------------------------- |
| `payments.types.ts`            | Tipos: `PaymentPlan`, `MercadoPagoPreapproval`, interfaces    |
| `payments.domain.ts`           | Pure: `buildCheckoutUrl`, `derivePremiumStateChange`, helpers |
| `payments.domain.test.ts`      | Testes do dominio (status → action, URL building)             |
| `mercadopago.client.ts`        | Wrapper HTTP do MP (`getPreapproval`)                         |
| `mercadopago.usecases.ts`      | Orquestracao: `createCheckoutUrl`, `handleNotification`       |
| `mercadopago.usecases.test.ts` | Testes via mock do client e do `SubscriptionUseCases`         |
| `mercadopago.routes.ts`        | Rotas Express + validacao HMAC do webhook                     |

## Data Model

Sem tabelas proprias. Tudo derivado:

- `external_reference` no MP = `userId` do Lucro Caseiro
- Estado do Premium fica em `users.plan` / `users.planExpiresAt`

## Invariants

- `createCheckoutUrl` lanca erro se o plano correspondente nao tiver `preapproval_plan_id` configurado
- Webhook processa apenas eventos `subscription_preapproval` ou `subscription_authorized_payment`; demais sao ignorados (200 OK silencioso)
- Status `authorized` ativa premium; `cancelled` ou `paused` desativam; `pending` e ignorado (sem mudanca de estado)
- Validacao de assinatura HMAC: `manifest = id:<dataId>;request-id:<requestId>;ts:<ts>;` com SHA256 + secret
- Quando `MERCADOPAGO_WEBHOOK_SECRET` e vazio (dev/test), validacao e bypassed
- `external_reference` vazio no preapproval → no-op (nao da pra resolver o usuario)

## Operations

```yaml
feature: payments
app: api
mobile_counterpart: subscription/use-mercadopago
api:
  base: /api/v1/payments/mercadopago
  endpoints:
    - method: POST
      path: /checkout
      auth: required
      body: { plan: "monthly" | "annual" }
      response: { url: string }
  webhook_base: /api/v1/webhooks
  webhook_endpoints:
    - method: POST
      path: /mercadopago
      auth: HMAC via x-signature header
      body: MercadoPagoNotification
      response: 200 { ok: true } | 400 INVALID_PAYLOAD | 401 INVALID_SIGNATURE
external_apis:
  - GET https://api.mercadopago.com/preapproval/:id (Bearer access token)
env:
  - MERCADOPAGO_ACCESS_TOKEN (server-to-server)
  - MERCADOPAGO_WEBHOOK_SECRET (HMAC validation)
  - MERCADOPAGO_PLAN_MONTHLY_ID (preapproval_plan id)
  - MERCADOPAGO_PLAN_ANNUAL_ID (preapproval_plan id)
```

## Authorization & RLS

- `/checkout` exige `authMiddleware` (token JWT do usuario logado)
- Webhook valida `x-signature` + `x-request-id` via HMAC SHA256 (timing-safe compare)
- `userId` no checkout e extraido do JWT, nunca do body — impede um usuario assinar Premium para outro
- `external_reference` no MP e definido pelo backend como o `userId` autenticado

## Contracts (Zod/DTO)

- **Body do `/checkout`**: `{ plan: "monthly" | "annual" }` — validacao manual (outros valores retornam 400)
- **Resposta do `/checkout`**: `{ url: string }` — URL `https://www.mercadopago.com.br/subscriptions/checkout?...`
- **Webhook payload (MP)**: `{ type: string, action?: string, data: { id: string } }` — apenas `data.id` e usado para buscar o preapproval real

## Errors

| Status | Quando                                               | Mensagem            |
| ------ | ---------------------------------------------------- | ------------------- |
| 400    | Plan invalido no checkout                            | INVALID_PLAN        |
| 400    | Webhook sem `type` ou `data.id`                      | INVALID_PAYLOAD     |
| 401    | Webhook com assinatura invalida (secret configurado) | INVALID_SIGNATURE   |
| 500    | `MERCADOPAGO_PLAN_*_ID` nao configurado              | erro proxy via next |

## Events / Side effects

- `handleNotification`: ativa/desativa premium via `SubscriptionUseCases`
- Sem persistencia local de eventos do MP (idempotente — pode receber o mesmo evento varias vezes sem efeito colateral indesejado)

## Performance

- 1 chamada externa ao MP por webhook (`getPreapproval`)
- Sem cache (eventos sao raros, ~1 por usuario por mes)
- Checkout URL e construida sincronamente (sem chamada externa)

## Security

- Access token MP e server-only (nunca exposto ao cliente)
- Validacao HMAC do webhook impede ativacao Premium fraudulenta
- `userId` no `external_reference` vem do JWT autenticado, nao do cliente
- `timingSafeEqual` para evitar timing attacks na comparacao de assinaturas

## Test matrix

### Domain (payments.domain.test.ts)

- buildCheckoutUrl: inclui plan_id e external_reference, URL-encode em chars especiais
- selectPlanId: monthly/annual
- derivePremiumStateChange: authorized + end_date, authorized + next_payment_date, authorized null, cancelled, paused, pending
- isSubscriptionEvent: tipos validos vs invalidos

### UseCases (mercadopago.usecases.test.ts)

- createCheckoutUrl: monthly/annual, plano nao configurado lanca erro
- handleNotification: ativa em authorized, desativa em cancelled, ignora outros tipos, ignora external_reference vazio, ignora pending

## Examples

```
POST /api/v1/payments/mercadopago/checkout
Authorization: Bearer <jwt>
{ "plan": "monthly" }
=> 200 { "url": "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=PLAN&external_reference=user-123" }

POST /api/v1/webhooks/mercadopago
x-signature: ts=1234567890,v1=abc123...
x-request-id: req-xyz
{ "type": "subscription_preapproval", "data": { "id": "mp-pre-1" } }
=> 200 { "ok": true }
```

## Change log / Decisions

- Primeira versao: integracao via **Preapproval Plans** (assinatura recorrente nativa do MP)
- Plans criados manualmente no painel MP — IDs vivem em env vars (nao em DB)
- Estado do Premium e fonte unica em `users.plan` — sem tabela de payments propria
- Validacao HMAC opcional: secret vazio = bypass (dev/test); em producao, secret e obrigatorio
- Status `pending` e tratado como no-op (nao desativa premium ate confirmacao)
- Mobile abre URL no browser externo (nao webview) — fluxo padrao do MP
- Coexiste com RevenueCat (Apple/Google IAP) — usuario escolhe via paywall qual usar
