---
id: c4e91b20-6a2f-4d8e-9b1c-5e0a7f3d8c41
slug: ui
type: scar
title: Skeletons devem espelhar a estrutura real do componente
tags: skeleton, loading, ux, listas, cards, todas-as-rotas
provenance: dito
evidence: Pedido da usuária em 2026-07-26; apps/mobile/src/shared/components/skeleton.tsx com variantes product/sale/client/material/…
decay: stable
created: 2026-07-26T04:20:00.000000000+00:00
updated: 2026-07-26T04:20:00.000000000+00:00
validated: 2026-07-26T04:20:00.000000000+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-26): skeletons genéricos (linhas soltas com avatar) não representam a UI real e geram sensação de layout incompleto. REGRA: todo loading de conteúdo deve usar variantes realistas em `skeleton.tsx` (`SkeletonList variant="product"|"sale"|"client"|"material"|"recipe"|"supplier"|"purchase"|"order"|"fiado"|"quote"|"label"|"amount"|"picker"`, além de `SkeletonSummaryStrip`, `SkeletonTable`, `SkeletonFinanceDashboard`, `SkeletonHome`). O skeleton deve espelhar foto/avatar, cards, badges, valores e ações do componente final. Não usar texto “Carregando…” no lugar de skeleton de conteúdo. Botões de submit continuam com ActivityIndicator. COMO EVITAR: ao criar lista/tela nova, adicionar ou reutilizar uma variante antes de publicar; nunca defaultar para `variant="plain"` em listas de domínio.
