---
id: 3f396967-9ee9-41b1-b817-725c8caf447f
slug: geral
type: fact
title: Status do lançamento Lucro Caseiro (2026-07-08): billing 3-tiers no ar, falta subir build + testar
tags: lancamento, billing, stripe, google-play, status
provenance: observado
evidence: Sessão 2026-07-08: prints do Stripe/Play Console + health da API produção. IDs de assinatura conferidos contra packages/contracts/src/schemas/plans.ts STORE_PRODUCT_IDS.
decay: volatile
created: 2026-07-08T18:00:33.287074500+00:00
updated: 2026-07-08T18:00:33.287074500+00:00
validated: 2026-07-08T18:00:33.287074500+00:00
links: 
---

Progresso do lançamento em 2026-07-08 (sessão longa de setup de billing):

**FEITO:**

- Crash AdMob em conta free/produção: corrigido no código (ver scar [[app-crashava-ao-abrir-em-conta-free-em-produ]]).
- Build de produção `.aab` gerada via EAS (perfil `production`, conta marivscls5). Artefato: expo.dev/artifacts/eas/SRN3XSVdIgmys25UdjG1KUIoGGbRlipvAVmZv914aac.aab
- **Stripe Live** (conta Orionseven Software LTDA, compartilhada c/ Lucas): 4 prices criados + webhook (`/api/v1/webhooks/stripe`, 4 eventos) + `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`/4x `STRIPE_PRICE_*` no Railway. Ver [[stripe-live-4-price-ids-dos-tiers-url-do-webhook-c]].
- **Migration 029** rodada no Supabase (enum plan_type += essential/professional; UPDATE premium→professional).
- **Google Play**: 4 assinaturas criadas com IDs exatos (`lucrocaseiro_{essential,professional}_{monthly,annual}`), plano básico Brasil ativo (29,90/299/69,90/699). Antigas premium mantidas (mapeiam p/ professional). Service account JSON JÁ configurado no Railway (`health.config.googlePlay=true`).
- API produção respondendo `{"stripe":true,"googlePlay":true}`.

**FALTA:**

- Subir a `.aab` nova num track (interno→produção) — a instalada ainda é antiga.
- Testar compra real (Android via Play + Stripe web).
- Política pré-produção: "Detalhes de login ausentes" (login de teste p/ revisores Google); aviso Android 15 edge-to-edge.
- (Opcional) rolar o `whsec_` do webhook (foi colado no chat; usuária optou por não rolar).

Ver [[stripe-billing-live-launch-todo]].
