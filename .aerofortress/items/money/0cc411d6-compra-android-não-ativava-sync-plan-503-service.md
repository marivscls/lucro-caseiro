---
id: 0cc411d6-bbbb-4d0f-a3c1-90182a7492ef
slug: money
type: scar
title: Compra Android não ativava: /sync-plan 503 = service account sem permissão "Ver dados financeiros" (API Purchases)
tags: android, google-play, sync-plan, service-account, 503, purchases-api, billing
provenance: observado
evidence: Railway HTTP Logs @lucro-caseiro/api 2026-07-08: POST /api/v1/subscription/sync-plan 503→200 após marcar permissões financeiras do service account. google-play.client.ts:114-120; use-subscription.ts:134,169.
decay: stable
created: 2026-07-08T19:47:29.903883300+00:00
updated: 2026-07-08T19:47:29.903883300+00:00
validated: 2026-07-08T19:47:29.903883300+00:00
links: 
---

SINTOMA: no Android, a compra passava no Google Play (usuária recebia email "Comece a usar sua assinatura"), mas o plano NÃO ativava — recursos não liberavam e a tela de sucesso não disparava. Nenhum erro visível no app. Emails repetidos de "assinatura será cancelada e reembolsada" (compra não reconhecida/acknowledge).

CAUSA: `POST /api/v1/subscription/sync-plan` retornava **503**. Vem de `apps/api/src/features/subscription/google-play.client.ts:114-120` — o `auth.request()` pra API `androidpublisher/.../subscriptionsv2` do Google **falhava** porque o **service account** (`google-play-android-developer@lucro-caseiro.iam.gserviceaccount.com`) NÃO tinha a permissão de **"Ver dados financeiros, pedidos e respostas à pesquisa de cancelamento"** (é ela que dá acesso à **API Purchases**) no Play Console. O JSON estava no Railway (`health.googlePlay=true` só confirma presença, NÃO permissão).

Efeito colateral: o `finishTransaction`/acknowledge (`use-subscription.ts:134`) só roda DEPOIS do sync dar certo — como dava 503, a compra nunca era reconhecida → Google mandava email e reembolsava. E `verifyPurchase` roda como `void` (`use-subscription.ts:169`), então o erro falhava em SILÊNCIO (usuária não via nada).

CORREÇÃO: Play Console → Usuários e permissões → o service account → seção **Dados financeiros** → marcar **"Ver dados financeiros..."** + **"Gerenciar pedidos e assinaturas"** → Salvar. Propaga em minutos. Confirmado: sync-plan passou a retornar **200** e o plano ativou (2026-07-08).

COMO DIAGNOSTICAR RÁPIDO NO FUTURO: compra Android não ativa → Railway HTTP Logs → status do `POST /sync-plan`. 503 = service account/permissão (esta correção). 200 mas continua free = problema de mapeamento de productId/estado. Ver [[stripe-live-4-price-ids-dos-tiers-url-do-webhook-c]] e [[premium-comprado-ainda-com-limites-sincronizacao]].
