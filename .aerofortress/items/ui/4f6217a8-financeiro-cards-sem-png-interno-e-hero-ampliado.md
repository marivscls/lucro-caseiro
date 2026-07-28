---
id: 4f6217a8-2d36-42f8-aa8d-c591127670e9
slug: ui
type: scar
title: Financeiro: cards sem PNG interno e hero ampliado apenas no app nativo
tags: financeiro, cards, mobile-nativo, pwa, web, breakpoint, png, hero, filtros, platform
provenance: dito
evidence: Capturas e correções da usuária em 2026-07-25; apps/mobile/src/features/finance/components/finance-dashboard.tsx; lint focado, TypeScript, 399 testes e build PWA aprovados
decay: stable
created: 2026-07-25T19:30:22.832716800+00:00
updated: 2026-07-26T02:40:46.433159700+00:00
validated: 2026-07-26T02:40:46.433159700+00:00
links: replaces:73b53e60-7148-4b88-bc67-6d38d106be25
---

CORREÇÕES MAIS RECENTES DA USUÁRIA (2026-07-25): (1) Entradas/Saídas não usam os bitmaps `finance-card-*-bg-v2.png`, pois eles desenhavam uma placa interna duplicada; `SummaryCard` usa somente superfície semântica e elementos em código. (2) Usar apenas `viewportWidth < 700` para ampliar o hero de lucro aumentou também a PNG na PWA estreita, o que estava errado. CORREÇÃO CANÔNICA: a PWA/web sempre usa o hero base (`48%` de largura, `96%` de altura); somente o app nativo compacto (`Platform.OS !== "web"` e largura < 700) usa `70%`/`128%`. (3) No layout compacto, a linha Hoje/7 dias/Mês/Personalizado sobe: o conteúdo usa 12 px no topo e o filtro remove a margem superior extra de 24 px. COMO EVITAR: “mobile” não significa somente breakpoint; quando a intenção for exclusivamente Android/iOS, combinar largura e plataforma. Não reintroduzir PNG de superfície dentro dos summary cards.
