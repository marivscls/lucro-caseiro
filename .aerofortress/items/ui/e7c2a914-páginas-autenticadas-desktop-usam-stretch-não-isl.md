---
id: e7c2a914-3b8a-4c1d-9e2f-6a0d8b5c4e71
slug: ui
type: scar
title: Páginas autenticadas no desktop usam stretch, não ilha centralizada
tags: desktop, responsividade, desktopStretch, precificacao, layout-canonico
provenance: dito
evidence: Usuária aprovou Precificação (form + aside sticky + CTAs em linha + alinhado ao título) em 2026-07-26; mapeamento e rollout nas demais rotas autenticadas
decay: stable
created: 2026-07-26T04:40:00.000000000+00:00
updated: 2026-07-26T04:40:00.000000000+00:00
validated: 2026-07-26T04:40:00.000000000+00:00
links:
---

REFERÊNCIA APROVADA: Precificação (simple/advanced) — conteúdo alinhado à esquerda sob o ScreenHeader, zona de dados até 1280 px, campos de dinheiro compactos (~360), formulário + preview sticky (~400), CTAs em linha horizontal.

CORREÇÃO (2026-07-26): “só trocar contained→stretch” NÃO basta. Nova Venda ainda parecia mobile porque usava `desktopWidths.form` (1040) + wizard single-column + footer absoluto — sem aside. Checklist: `apps/mobile/src/shared/layout/desktop-screen-checklist.md`.

REGRA CANÔNICA (`apps/mobile/src/shared/layout/desktop-density.ts`):
1. Páginas autenticadas full-page → `desktopStretch(isDesktop, data 1280)` (+ `pageGutter`). Nunca `desktopContained` nem cap `form` 1040 no chrome da página.
2. Form/wizard com resumo → `desktopSplitLayout` + aside sticky com total + CTAs (padrão Nova Venda / Precificação).
3. Dinheiro/qty/% → `desktopCompactField`. Busca → maxWidth ~480.
4. CTAs desktop → aside ou linha horizontal; não barra absoluta estreita no desktop.
5. Listas de cards → stretch + grid 2–3 colunas; tabelas só stretch.
6. `desktopContained` / `desktopModalSurface` → só auth, onboarding, modais.

COMO EVITAR: não declarar “todas as telas ok” sem checklist + screenshot desktop; não importar `@lucro-caseiro/ui` em `desktop-density.ts` (quebra Metro).
