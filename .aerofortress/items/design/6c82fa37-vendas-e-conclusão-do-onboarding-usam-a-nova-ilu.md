---
id: 6c82fa37-6a4d-45bb-a4e7-d807730b0e9c
slug: design
type: decision
title: Vendas e conclusão do onboarding usam a nova ilustração 3D
tags: vendas, onboarding, empty-state, png, ilustracao, pwa, preload, tamanho
provenance: dito
evidence: Capturas e pedidos da usuária em 2026-07-25/26; apps/mobile/src/app/tabs/sales.tsx; apps/mobile/src/app/onboarding.tsx; apps/mobile/src/assets/sales-empty-v2.png; apps/mobile/src/shared/static-image-assets.ts; ESLint direcionado e typecheck mobile aprovados em 2026-07-26
decay: stable
created: 2026-07-26T03:01:59.276871800+00:00
updated: 2026-07-26T03:43:09.262215500+00:00
validated: 2026-07-26T03:43:09.262215500+00:00
links:
---

A usuária escolheu em 2026-07-25 o arquivo `imagens/png-3d/ChatGPT Image Jul 25, 2026, 02_03_42 PM.png` para substituir a ilustração do estado vazio da tela de Vendas e, em 2026-07-26, pediu a mesma arte na etapa final “Tudo pronto!” do onboarding. O asset canônico é `apps/mobile/src/assets/sales-empty-v2.png`, PNG transparente 1024×1024 otimizado e integrante do preload estático. Vendas o renderiza em 220×220 e a conclusão do onboarding em 158×158, ambos com `resizeMode="contain"`. O slide introdutório “Sua rotina, num só lugar” continua usando `sales-empty.png`; a troca foi exclusiva da etapa final mostrada pela usuária.
