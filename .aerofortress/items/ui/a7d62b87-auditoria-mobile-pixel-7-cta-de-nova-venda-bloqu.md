---
id: a7d62b87-c2a6-462f-bde5-32eee73a87f3
slug: ui
type: fact
title: Auditoria mobile Pixel 7: CTA de Nova Venda bloqueado pela tab bar e fonte ampliada corta rótulos
tags: mobile, android, ui, ux, maestro, validado
provenance: observado
evidence: apps/mobile/src/app/tabs/new-sale.tsx; apps/mobile/src/app/tabs/_layout.tsx; apps/mobile/src/app/finance.tsx; .aerofortress/specs/prd-correcao-usabilidade-mobile-2026-08.md
decay: seasonal
created: 2026-08-03T18:33:15.264816200+00:00
updated: 2026-08-03T19:25:25.973014500+00:00
validated: 2026-08-03T19:25:25.973014500+00:00
links: 
---

Teste exploratório no AVD Pixel 7 `lucro_e2e` (1080×2400, densidade 420) em 2026-08-03, com sessão autenticada. Antes do ajuste, o CTA `Próximo` de Nova Venda ocupava `[632,2118][994,2234]`, a tab bar começava em `y=2148` e um toque central abria Agenda. A correção passou a derivar o clearance de `floatingTabBarContentPadding`; depois, o CTA terminou em `y=2061`, 87 px acima da tab bar, e o Maestro 21 avançou até Forma de pagamento com saída 0. Também foram corrigidos rótulos da tab bar em `font_scale=1.3`, composição do resumo financeiro, seções iniciais do modal Novo Produto, navegação de volta de Financeiro e expectativas Maestro. Os fluxos 03, 04 e 21, lint, typecheck, Prettier e 420 testes mobile passaram; o emulador foi restaurado para fonte 1.0.
