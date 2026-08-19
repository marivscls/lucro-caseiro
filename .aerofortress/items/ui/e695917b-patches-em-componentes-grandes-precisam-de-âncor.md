---
id: e695917b-5a1d-4783-8b81-d540a9c39403
slug: ui
type: scar
title: Patches em componentes grandes precisam de âncoras de função exclusivas
tags: catalogo, react-native, patch, typecheck
provenance: observado
evidence: apps/mobile/src/app/catalog.tsx; pnpm --filter @lucro-caseiro/mobile typecheck (falhou e depois passou)
decay: stable
created: 2026-08-17T00:09:33.868913600+00:00
updated: 2026-08-17T00:09:33.868913600+00:00
validated: 2026-08-17T00:09:33.868913600+00:00
links:
---

FALHA CORRIGIDA (2026-08-16): durante o redesign de Catálogo, um patch ancorado apenas no trecho genérico `}>) { const { theme } = useTheme();` inseriu `visibilityLabel` dentro de `SummaryMetric`, embora a variável pertencesse a `CatalogItemVisibility`. O typecheck detectou os símbolos inexistentes. COMO EVITAR: em arquivos com muitos componentes React semelhantes, ancorar o patch na assinatura/nome exclusivo da função e executar `tsc --noEmit` imediatamente após a edição.
