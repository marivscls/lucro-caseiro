# Subscription Setup - Stripe Billing

Configuracao atual: **Stripe Checkout + webhooks** para pagamentos fora da loja. O app abre uma Stripe Checkout Session e o backend ativa/desativa o plano a partir dos eventos assinados da Stripe. O fluxo Google Play Billing continua disponivel no codigo para builds Android que precisem cumprir regras da Play Store.

Plano pago: **Premium** (decisao de 2026-11-15, ver `docs/planos-comerciais.md`), com preco mensal e anual. O Premium usa as variaveis do antigo Profissional; as do Essencial ficam so para reconhecer assinaturas antigas.

## Produtos

| Plano   | Periodo | Preco     | Stripe Price ID                        |
| ------- | ------- | --------- | -------------------------------------- |
| Premium | Mensal  | R$ 49,90  | `STRIPE_PRICE_PROFESSIONAL_MONTHLY_ID` |
| Premium | Anual   | R$ 449,00 | `STRIPE_PRICE_PROFESSIONAL_ANNUAL_ID`  |

Legado (nao vendido): `STRIPE_PRICE_ESSENTIAL_{MONTHLY,ANNUAL}_ID` (R$ 29,90 / R$ 299,00) e os Prices antigos do Profissional (R$ 69,90 / R$ 699,00). Assinaturas antigas continuam nesses Prices ate a pessoa cancelar; o plano e reconhecido pela metadata `tier`. O checkout cria sempre a sessao com o Price do Premium, mesmo que o pedido diga `essential`.

## 1. Stripe Dashboard

1. Acesse Stripe Dashboard -> **Product catalog**.
2. No produto do plano pago (renomeie para **Lucro Caseiro Premium**), crie dois Prices recorrentes novos: mensal R$ 49,90 e anual R$ 449,00. Nao apague os Prices antigos: ha assinaturas neles.
3. Copie os dois IDs `price_...` novos para `STRIPE_PRICE_PROFESSIONAL_MONTHLY_ID` e `STRIPE_PRICE_PROFESSIONAL_ANNUAL_ID` (segredos da API no Fly).
4. Arquive no Stripe os Prices do Essencial para nao serem usados em novas vendas.
5. Use chaves `live` em producao e `test` em desenvolvimento.

Google Play: nos produtos `lucrocaseiro_professional_monthly` e `_annual`, mude o preco do plano base para R$ 49,90 e R$ 449,00 mantendo assinantes atuais no preco antigo (opcao de preco legado do Play Console), e desative os planos base do Essencial para novas compras.

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

### 4.1 Notificacoes em tempo real (RTDN)

Sem RTDN o backend so sabe de uma renovacao ou cancelamento quando o app chama `/sync-plan`. Com RTDN o Google avisa o backend por Pub/Sub push e o endpoint `POST /api/v1/webhooks/google-play` renova (`activatePlan`) ou encerra (`deactivatePlan`) o plano mesmo que a pessoa nao abra o app. So vale para compras que ja foram sincronizadas pelo app ao menos uma vez (token vinculado em `subscription_purchase_claims`).

Pre-requisito: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` ja configurado (e o mesmo acesso usado pelo `/sync-plan` para ler o subscriptionsv2).

Passo a passo (Lucas), no projeto Google Cloud ligado ao Play Console:

1. **Ativar a API** Cloud Pub/Sub no projeto.
2. **Criar o topico**: Pub/Sub -> Topics -> Create topic, id `play-rtdn`
   (ou `gcloud pubsub topics create play-rtdn`).
3. **Deixar o Google Play publicar no topico**: no topico -> Permissions -> Add principal `google-play-developer-notifications@system.gserviceaccount.com` com o papel **Pub/Sub Publisher**
   (ou `gcloud pubsub topics add-iam-policy-binding play-rtdn --member=serviceAccount:google-play-developer-notifications@system.gserviceaccount.com --role=roles/pubsub.publisher`).
4. **Criar a service account do push** (so assina o token, sem papeis extras): IAM -> Service accounts -> Create, ex.: `rtdn-push@<projeto>.iam.gserviceaccount.com`. Em projetos antigos (antes de abril/2021), de ao agente do Pub/Sub `service-<numero-do-projeto>@gcp-sa-pubsub.iam.gserviceaccount.com` o papel **Service Account Token Creator** nessa service account.
5. **Criar a push subscription com autenticacao**: Pub/Sub -> Subscriptions -> Create subscription, topico `play-rtdn`, Delivery type **Push**, endpoint `https://<api>/api/v1/webhooks/google-play`, marque **Enable authentication**, escolha `rtdn-push@...` e deixe a audience como a propria URL do endpoint (ou preencha uma audience fixa)
   (ou `gcloud pubsub subscriptions create play-rtdn-push --topic=play-rtdn --push-endpoint=https://<api>/api/v1/webhooks/google-play --push-auth-service-account=rtdn-push@<projeto>.iam.gserviceaccount.com --push-auth-token-audience=https://<api>/api/v1/webhooks/google-play`).
6. **Configurar a API** (Railway) com os mesmos valores:

   ```env
   GOOGLE_PLAY_RTDN_AUDIENCE=https://<api>/api/v1/webhooks/google-play
   GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT_EMAIL=rtdn-push@<projeto>.iam.gserviceaccount.com
   ```

   Sem as duas variaveis o endpoint responde 503 e nao faz nada.

7. **Ligar no Play Console**: app -> Monetizar com o Play -> **Configuracao de monetizacao** (Monetization setup) -> Notificacoes do desenvolvedor em tempo real: Topic name `projects/<projeto>/topics/play-rtdn`, conteudo "Assinaturas" (ou assinaturas + compras anuladas), salvar.
8. **Enviar notificacao de teste**: no mesmo bloco, clique em **Send test notification**. Confira:
   - log da API com `"event":"google_play_rtdn"` e `"reason":"test_notification"` (resposta 200);
   - na push subscription, as mensagens aparecem como confirmadas (sem backlog crescendo);
   - 401 no log de acesso = audience ou e-mail da service account nao batem; 503 = variaveis ausentes.

Respostas do endpoint: 200 quando processou ou ignorou de proposito (teste, outro pacote, token nao vinculado, plano de outro canal mais longo); 401 para token OIDC invalido; 503 quando nao configurado ou quando o Google esta indisponivel (o Pub/Sub reenvia sozinho). O purchase token nunca vai para o log.

## 5. Testar

1. Crie os 4 Products/Prices recorrentes na Stripe (2 tiers x mensal/anual).
2. Configure o webhook da Stripe para `https://<api>/api/v1/webhooks/stripe`.
3. Inclua eventos `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted`.
4. No app, abra a paywall, escolha o plano/periodo e toque em assinar.
5. O checkout deve abrir pela Stripe.
6. Apos o pagamento, o webhook atualiza `users.plan` para `essential` ou `professional`.
7. Teste cancelamento/expiracao pelo painel Stripe e confirme o downgrade para `free`.

## Checklist

- [ ] Prices do Premium (R$ 49,90 mensal e R$ 449,00 anual) criados na Stripe e IDs nos segredos da API
- [ ] `STRIPE_SECRET_KEY` no backend de producao
- [ ] `STRIPE_WEBHOOK_SECRET` no backend de producao
- [ ] Os 4 `STRIPE_PRICE_*_ID` configurados
- [ ] Product ids equivalentes criados no Google Play
- [ ] RTDN: topico + push subscription autenticada + `GOOGLE_PLAY_RTDN_*` na API + topico no Play Console
- [ ] "Send test notification" aparece no log como `test_notification`
- [ ] Webhook Stripe apontando para `/api/v1/webhooks/stripe`
- [ ] Compra teste ativa o plano correto (essential/professional)
- [ ] Cancelamento/expiracao desativa (volta para free)
