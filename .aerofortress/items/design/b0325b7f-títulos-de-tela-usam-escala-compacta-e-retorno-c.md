---
id: b0325b7f-3878-4c29-ae37-8f107ebefc32
slug: design
type: decision
title: Títulos de tela usam escala compacta e retorno com ChevronLeft
tags: tipografia, titulos, screen-header, mobile, chevron-left, navegacao
provenance: dito
evidence: Pedido e captura da usuária em 2026-07-25; packages/ui/src/components/typography.tsx; apps/mobile/src/shared/components/screen-header.tsx; apps/mobile/src/shared/components/app-icon.tsx
decay: stable
created: 2026-07-25T23:37:56.713586900+00:00
updated: 2026-07-25T23:37:56.713586900+00:00
validated: 2026-07-25T23:37:56.713586900+00:00
links:
---

A usuária pediu que os títulos de todas as telas ficassem menores e mais harmônicos e que o ícone de retorno mudasse de ArrowLeft para ChevronLeft. A escala canônica de títulos de rota no mobile é a variante `screenTitle`: 24 px, linha de 30 px, Nunito Sans Bold 700; `ScreenHeader` e as abas-raiz usam essa variante, sem reduzir `h1`/`display` destinados a títulos fortes de conteúdo. O retorno canônico usa `chevron-back`, mapeado para `ChevronLeft`; o alias legado `arrow-back` também resolve para `ChevronLeft` para evitar regressão visual. CORREÇÃO (2026-07-26): `ScreenHeader` não deve usar `adjustsFontSizeToFit` no título — ações à direita (busca/filtro) encolhiam “Insumos” vs “Produtos” e quebravam a padronização; overflow usa ellipsis (`numberOfLines={1}`).
