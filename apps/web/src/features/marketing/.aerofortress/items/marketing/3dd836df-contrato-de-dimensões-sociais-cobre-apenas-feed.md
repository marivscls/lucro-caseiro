---
id: 3dd836df-f8e5-4304-8487-1271d3129485
slug: marketing
type: fact
title: Contrato de dimensões sociais cobre apenas feed e carrossel do Instagram
tags: formatos-sociais, dimensoes, instagram, reels, stories, linkedin, facebook
provenance: observado
evidence: apps/api/src/features/marketing/marketing.system-prompt.ts:26; apps/web/src/features/marketing/content-brief.ts:1-18; busca rg no módulo de marketing em 2026-08-11
decay: volatile
created: 2026-08-11T17:20:18.026917300+00:00
updated: 2026-08-11T17:20:18.026917300+00:00
validated: 2026-08-11T17:20:18.026917300+00:00
links:
---

AUDITORIA OBSERVADA (2026-08-11): o contrato visual canônico instrui 1080×1350 px (4:5) somente para feed e carrossel do Instagram. O seletor também oferece Reels, Stories, Threads, Facebook e LinkedIn, mas não há no módulo de marketing regra específica de dimensão/proporção para esses destinos nem validação determinística de dimensões. Consequência: feed/carrossel do Instagram está corretamente orientado; formatos 9:16 e adaptações específicas por canal podem sair sem tamanho adequado até existir um mapa estruturado por canal/formato.
