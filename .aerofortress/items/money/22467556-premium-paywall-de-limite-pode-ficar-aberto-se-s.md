---
id: 22467556-ce70-4672-a92b-b64a82984cca
slug: money
type: scar
title: Premium: paywall de limite pode ficar aberto se só invalidar assinatura
tags: premium, limits, paywall
provenance: observado
evidence: apps/mobile/src/features/subscription/use-subscription.ts; apps/mobile/src/app/_layout.tsx; apps/mobile/src/features/subscription/limits.ts
decay: stable
created: 2026-06-29T13:00:23.111746900+00:00
updated: 2026-06-29T13:00:23.111746900+00:00
validated: 2026-06-29T13:00:23.111746900+00:00
links: 
---

Ao confirmar compra Premium, não basta invalidar `['subscription']`: atualize imediatamente o cache de `['subscription','profile']`, feche o paywall quando `isProfilePremiumActive(profile)` virar true e trate `FreemiumLimits.max* = null` como ilimitado no banner/guard. Caso contrário, uma compra válida pode continuar mostrando “limite atingido” até o refetch/estado visual alcançar o backend.
