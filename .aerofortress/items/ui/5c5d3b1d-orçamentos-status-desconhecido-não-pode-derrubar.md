---
id: 5c5d3b1d-2cab-4bac-878b-4abf36cbd2f1
slug: ui
type: scar
title: Orçamentos: status desconhecido não pode derrubar QuoteCard
tags: orcamentos, status, seed, render-error, fallback
provenance: observado
evidence: apps/mobile/src/app/quotes.tsx; packages/database/src/seeds/seed-full-mariana.sql; screenshot da usuária em 2026-07-13; lint e typechecks mobile/database aprovados
decay: stable
created: 2026-07-13T03:15:39.456055800+00:00
updated: 2026-07-13T03:15:39.456055800+00:00
validated: 2026-07-13T03:15:39.456055800+00:00
links: 
---

SINTOMA (2026-07-13): abrir a tela de Orçamentos causava Render Error `Cannot read property 'label' of undefined` em `QuoteCard`. CAUSA: o seed completo gravava `status='expired'`, enquanto `QuoteStatus` e `STATUS_META` só reconheciam pending/accepted/rejected; a UI indexava o mapa sem fallback. CORREÇÃO: `quoteStatusMeta(status)` trata `expired` como “Expirado” e oferece fallback seguro para qualquer valor inesperado, usado na lista e no detalhe; o seed deixou de gerar o status fora do contrato. COMO EVITAR: valores vindos de coluna text/seed não devem ser indexados cegamente em mapas tipados; validar/normalizar na fronteira ou fornecer fallback de renderização, e manter seeds dentro dos enums do contrato.
