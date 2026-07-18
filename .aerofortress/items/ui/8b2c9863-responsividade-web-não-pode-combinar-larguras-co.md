---
id: 8b2c9863-3fd2-4dc0-ab32-6449263eedee
slug: ui
type: scar
title: Responsividade web não pode combinar larguras com Math.max
tags: pwa, responsividade, desktop, mobile, sidebar, header, breakpoint, matchMedia, useSyncExternalStore, correcao
provenance: dito
evidence: apps/mobile/src/shared/layout/use-desktop-layout.ts; apps/mobile/src/shared/layout/use-desktop-layout.test.ts; matriz Chromium 390×844, 768×1024, 1023×900, 1024×900 e 1920×1080; 336 testes, typecheck, eslint dos arquivos e export PWA aprovados em 2026-07-17
decay: stable
created: 2026-07-17T16:14:51.193786500+00:00
updated: 2026-07-17T16:14:51.193786500+00:00
validated: 2026-07-17T16:14:51.193786500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-17): sidebar e header desktop apareciam em telas pequenas, enquanto telas muito grandes ainda podiam receber composição de celular/tablet. CAUSA NO HOOK CANÔNICO: `useDesktopLayout` combinava `useWindowDimensions().width` e `window.innerWidth` com `Math.max`; uma medição inicial, física ou desatualizada podia vencer a viewport CSS atual e todos os consumidores recebiam o ramo errado. CORREÇÃO: usar uma única fonte web reativa, `matchMedia('(min-width: 1024px)')`, assinada com `useSyncExternalStore`; Android/iOS permanecem sempre mobile. Sidebar, header, tab bar, formulários e layouts internos continuam consumindo o mesmo hook. COMO EVITAR: nunca arbitrar breakpoints somando/escolhendo o maior valor de APIs de viewport; a decisão responsiva deve vir de uma única media query CSS e ser testada imediatamente abaixo/acima do breakpoint.
