---
id: 4ea3ea49-5718-4918-9900-7fd3635281ce
slug: ui
type: scar
title: Resumo de Compras deve ser compacto e acompanhar a cor da marca
tags: purchases, summary, brand, color, revenda, responsive
provenance: dito
evidence: Capturas da usuária em 2026-08-04 e 2026-08-14; apps/mobile/src/app/purchases.tsx; bundle PWA Revenda entry-6f1c566f38564b5b833482d1b677e1ec.js contém `backgroundColor:e.colors.primaryBg` e `color:e.colors.primaryStrong`; typecheck, lint direcionado e build:pwa:revenda aprovados
decay: stable
created: 2026-08-05T01:44:08.950385700+00:00
updated: 2026-08-14T17:40:41.013414900+00:00
validated: 2026-08-14T17:40:41.013414900+00:00
links:
---

CORREÇÕES DA USUÁRIA: (1) em 2026-08-04, a faixa `Total a pagar` ocupava altura excessiva no topo de Compras e empurrava a lista; (2) em 2026-08-14, o fundo amarelo da faixa destoava da paleta azul do Lucro na Revenda. CORREÇÃO CANÔNICA: manter a faixa compacta com margem superior média, padding vertical pequeno, raio `lg` e ícone de 20 px; usar `theme.colors.primaryBg` no fundo e `theme.colors.primaryStrong` no ícone para acompanhar automaticamente a identidade da marca. O valor permanece em destaque com as cores textuais do tema. COMO EVITAR: resumos operacionais compactos não devem usar uma cor semântica arbitrária; quando não representam alerta ou status, herdam os tokens primários da marca.
