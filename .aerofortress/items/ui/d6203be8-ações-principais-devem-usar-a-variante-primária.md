---
id: d6203be8-9da7-43d5-ad49-3617b51a3926
slug: ui
type: scar
title: Ações principais devem usar a variante primária do Button
tags: button, cta, branding, catalog, purchases, visual-hierarchy
provenance: dito
evidence: apps/mobile/src/app/purchases.tsx; apps/mobile/src/app/catalog.tsx; capturas enviadas pela usuária em 2026-08-14; typecheck/lint/build:pwa:revenda aprovados
decay: stable
created: 2026-08-14T16:06:14.014778900+00:00
updated: 2026-08-14T16:52:47.751001800+00:00
validated: 2026-08-14T16:52:47.751001800+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-08-14): (1) no estado vazio de Compras do Lucro na Revenda, `Registrar compra` aparecia branco com contorno; (2) no Catálogo, o botão final `Salvar` também aparecia como ação secundária. Nos dois casos a causa era `variant="outline"` em uma ação principal. CORREÇÃO CANÔNICA: CTAs que criam o primeiro registro ou concluem/salvam o formulário usam a variante primária padrão do `Button`, herdando automaticamente a cor de cada marca. COMO EVITAR: reservar `outline` para ações realmente secundárias e revisar a hierarquia visual de todo CTA final.
