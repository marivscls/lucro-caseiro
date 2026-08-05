---
id: 60f1abb5-f1e9-4f15-b06a-2a1a71188a1b
slug: releases
type: fact
title: Compartilhamento direto da vitrine pelo WhatsApp publicado no painel de Serviços
tags: servicos, vitrine, whatsapp, pwa, deploy, railway, correcao
provenance: observado
evidence: Correção e captura da usuária em 2026-07-31; commit fad89d26d02cb6c6098b15158b1edf6a50748e88; Railway deployment e61a747d-5df7-4edf-9651-ba0efe98df7f; GitHub Actions run 30668346164; https://app.lucrocaseiro.com.br/services
decay: seasonal
created: 2026-07-31T21:43:27.077860800+00:00
updated: 2026-07-31T22:01:08.805191+00:00
validated: 2026-07-31T22:01:08.805191+00:00
links:
---

Em 2026-07-31, a primeira publicação (`417e18c`) adicionou WhatsApp somente à tela Catálogo e não resolveu o acionador mostrado pela usuária. A correção definitiva no commit `fad89d2` alterou `ServiceDashboardModal.shareService`: o botão agora se chama “Compartilhar no WhatsApp”, usa `openWhatsAppShare` e abre o seletor de conversas com a mensagem do serviço e o link da vitrine preenchidos, sem passar pelo share sheet do Windows. O deployment Railway do PWA `e61a747d-5df7-4edf-9651-ba0efe98df7f` terminou em SUCCESS. `https://app.lucrocaseiro.com.br/services`, `sw.js` e o bundle `entry-4f481fc30d9db470b019e2df69934e73.js` responderam 200; o service worker referencia o bundle, que contém o rótulo, a mensagem de serviço e `https://wa.me/`. Lint, typecheck, 419 testes, context lint e build PWA passaram; a CI ficou vermelha somente no `knip:full` pela dívida preexistente.
