---
id: 9f07282f-0fda-41b3-b127-47b74c533224
slug: releases
type: fact
title: Status de solicitações respondendo no primeiro toque — eef3310
tags: release, servicos, pwa, railway, ui, producao, status, optimistic-update
provenance: observado
evidence: commit eef33104ad8b130e3525607f7271f6fbe6bf387d; Railway deployment 5a4e5c91-e7ba-42de-bdf1-05a98ace5ee9; https://app.lucrocaseiro.com.br; GitHub Actions run 30667136423
decay: seasonal
created: 2026-07-31T20:51:38.933214100+00:00
updated: 2026-07-31T21:39:20.199548800+00:00
validated: 2026-07-31T21:39:20.199548800+00:00
links:
---

Em 2026-07-31, a correção funcional dos botões de status das solicitações de horário foi publicada na `main` no commit `eef33104ad8b130e3525607f7271f6fbe6bf387d` (`fix(services): respond immediately to booking status`), sucedendo o ajuste visual `a9d708f`. O deploy Railway do PWA `@lucro-caseiro/mobile` (`5a4e5c91-e7ba-42de-bdf1-05a98ace5ee9`) terminou em SUCCESS. Produção em `https://app.lucrocaseiro.com.br` respondeu 200 para HTML, service worker e bundle `entry-e5ca8d8c87b5a7f20f1007d989c5a248.js`; o bundle contém “Salvando status...” e a chave de booking requests. A correção usa atualização otimista, trava de toque repetido, estado pendente, rollback/alerta e reconciliação com o servidor. Lint, typecheck, build PWA e 419 testes móveis passaram localmente; a CI do commit foi cancelada automaticamente por um commit posterior que contém `eef3310` como ancestral.
