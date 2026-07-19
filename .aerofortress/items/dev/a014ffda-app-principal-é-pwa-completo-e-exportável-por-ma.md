---
id: a014ffda-1e3c-4012-83f7-9863f5451224
slug: dev
type: fact
title: App principal é PWA completo e exportável por marca
tags: pwa, whitelabel, mobile, web, marcas, isolamento
provenance: observado
evidence: apps/mobile/scripts/generate-pwa-service-worker.mjs; apps/mobile/scripts/serve-pwa.mjs; apps/mobile/package.json; docs/whitelabel/como-gerar-build.md; builds e previews validados em 2026-07-19
decay: seasonal
created: 2026-07-17T00:41:13.755356600+00:00
updated: 2026-07-19T04:10:45.054672400+00:00
validated: 2026-07-19T04:10:45.054672400+00:00
links:
---

O app principal em `apps/mobile` preserva a base Expo/React Native compartilhada com Android/iOS e exporta um PWA instalável pensado como canal completo para pessoas sem Android. Login e onboarding persistem no navegador; cadastros, precificação, vendas, agenda, clientes, catálogo, financeiro, fotos/câmera e checkout Stripe usam a mesma API; recibos, orçamentos, receitas e rótulos abrem impressão/salvamento em PDF no navegador; relatórios baixam por Blob.

Os scripts `build:pwa:caseiro`, `build:pwa:papelaria` e `build:pwa:manicure` compilam bundles com marca própria e gravam saídas isoladas em `apps/mobile/dist/lucro-caseiro`, `apps/mobile/dist/lucro-papelaria` e `apps/mobile/dist/lucro-manicure`. Os previews canônicos usam respectivamente as portas 8083, 8084 e 8085. Manifesto, título/metas, ícones, identidade interna, links da loja, atalhos e cache offline seguem a marca ativa; gerar ou servir uma marca não pode sobrescrever outra. Cada saída deve ser publicada em deploy/domínio separado.

Gaps confirmados anteriormente: lembretes com o PWA fechado exigem web push/VAPID e backend. Além disso, a assinatura nasce via Stripe no web, mas o gerenciamento/cancelamento Stripe ainda precisa ser validado de ponta a ponta.
