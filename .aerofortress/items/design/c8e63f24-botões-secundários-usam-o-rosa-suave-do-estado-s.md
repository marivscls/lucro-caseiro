---
id: c8e63f24-3c03-4bc4-a7e9-1ec8f3391f93
slug: design
type: decision
title: Botões secundários usam o rosa suave do estado selecionado
tags: botoes, secundario, rosa-suave, design-system, hierarquia
provenance: dito
evidence: apps/mobile/src/features/pricing/components/pricing-mode-switch.tsx; packages/ui/src/components/button.tsx; conversa da usuária em 2026-07-25
decay: stable
created: 2026-07-25T21:11:04.268949100+00:00
updated: 2026-07-25T21:11:04.268949100+00:00
validated: 2026-07-25T21:11:04.268949100+00:00
links:
---

Em 2026-07-25, a usuária aprovou replicar nos botões secundários o rosa suave visto no seletor `Simples`. Implementação canônica: a variante compartilhada `Button secondary` usa `theme.colors.primaryBg` com texto `theme.colors.primaryStrong`. CTAs primários continuam com `primaryInteractive`, e variantes de contorno/ghost permanecem distintas para preservar hierarquia.
