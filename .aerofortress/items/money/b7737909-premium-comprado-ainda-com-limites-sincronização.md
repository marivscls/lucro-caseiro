---
id: b7737909-9bdf-40f0-8fc7-d8b6808a3448
slug: money
type: scar
title: Premium comprado ainda com limites: sincronização precisa ser fonte do desbloqueio
tags: premium, limits, sync
provenance: dito
evidence: Mensagem do usuário em 2026-06-29: "ainda ta com limites no premium"
decay: stable
created: 2026-06-29T13:17:01.034408800+00:00
updated: 2026-06-29T13:17:01.034408800+00:00
validated: 2026-06-29T13:17:01.034408800+00:00
links: 
---

Correção do usuário após remover banners por estado Premium: ainda havia limites em conta com compra Premium. Não basta esconder UI quando `profile.plan` já veio Premium; o fluxo precisa garantir que a compra/restauração atualize o backend e que limites sejam invalidados/refetchados depois da confirmação. Ao investigar limites Premium, seguir a cadeia Google Play/Stripe → `sync-plan`/webhook → `profile` → `limits` → guards.
