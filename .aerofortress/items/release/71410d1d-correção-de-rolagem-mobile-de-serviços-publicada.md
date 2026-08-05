---
id: 71410d1d-1219-421f-904a-ee4b0d9867d7
slug: release
type: fact
title: Correção de rolagem mobile de Serviços publicada em 2026-07-31
tags: release, pwa, railway, services, mobile, scroll
provenance: observado
evidence: apps/mobile/src/app/services.tsx; commits 6639dd003fc123fa200af086af1dbd8b8c893002 e a9d708f3e5079db93f8ab0206ac72d305a8e6893; Railway deployment 22d8c07e-3b30-4cc2-a01b-f82ac7c029f0; https://app.lucrocaseiro.com.br/services
decay: seasonal
created: 2026-07-31T20:50:24.378415100+00:00
updated: 2026-07-31T20:50:24.378415100+00:00
validated: 2026-07-31T20:50:24.378415100+00:00
links:
---

A correção que move resumo, busca, filtros e cards da tela Serviços para a mesma FlatList rolável foi publicada no PWA principal. O commit da correção é `6639dd0` (`fix(services): restore mobile service scrolling`). Um commit concorrente descendente, `a9d708f`, tornou-se o deployment efetivo do Railway e preserva `6639dd0` como ancestral. O deployment `22d8c07e-3b30-4cc2-a01b-f82ac7c029f0` terminou `SUCCESS`; `https://app.lucrocaseiro.com.br/`, `/services` e `/sw.js` responderam 200, sem cache, e os três referenciaram o bundle `entry-2c7847c1bd2780183e7a171df4dff462.js`.
