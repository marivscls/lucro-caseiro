---
id: 9baa3017-a4e1-49f6-83ea-054b8e65e84c
slug: backend
type: scar
title: "Exclusão indisponível" e premium não libera = env var faltando no Railway, não bug de código
tags: 
provenance: observado
evidence: apps/api/src/main.ts:163-167 (supabaseAdmin null→503); apps/api/src/features/subscription/google-play.client.ts:75-79; apps/api/src/config.ts:12,15
decay: stable
created: 2026-06-25T23:38:05.545259800+00:00
updated: 2026-06-25T23:38:05.545259800+00:00
validated: 2026-06-25T23:38:05.545259800+00:00
links: 
---

Dois sintomas no app de prod que PARECEM bug de cliente mas são CONFIG do backend (Railway), porque as keys são opcionais no boot e degradam pra 503:

1. **"Exclusão de conta indisponível no momento"** → `SUPABASE_SERVICE_ROLE_KEY` vazia no Railway. `main.ts` cria `supabaseAdmin` só se a key existir; sem ela, `deleteAuthUser` lança ServiceUnavailableError com EXATAMENTE essa mensagem. O design (Auth-first, fail-safe) está certo — só falta a env var.
2. **Premium não libera mesmo assinando (Android)** → `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` vazia. Android passa por Google Play → `/sync-plan` → `GooglePlayClient.getPremiumState`, que lança "não configurado no servidor" sem o JSON. O plano nunca vira premium. O polling do cliente (use-stripe) NÃO resolve o Android — só cobre a corrida do webhook Stripe (iOS/web). Pra premium Android funcionar precisa: service account JSON no Railway + app numa trilha de teste do Google Play + license tester + produtos de assinatura criados.
   LIÇÃO: antes de caçar bug no mobile pra "indisponível"/"não configurado", cheque as env vars do Railway. Ver [[stripe-billing-live-launch-todo]] e [[railway-deploy-setup]].
