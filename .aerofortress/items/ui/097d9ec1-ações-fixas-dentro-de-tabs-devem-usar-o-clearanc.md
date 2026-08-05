---
id: 097d9ec1-1799-4dc5-a68e-eabd1a36a8b1
slug: ui
type: scar
title: Ações fixas dentro de Tabs devem usar o clearance canônico da tab bar
tags: android, mobile, tab-bar, cta, layout
provenance: observado
evidence: apps/mobile/src/app/tabs/new-sale.tsx; apps/mobile/.maestro/flows/21-new-sale-mobile-cta.yaml
decay: stable
created: 2026-08-03T19:25:26.022911300+00:00
updated: 2026-08-03T19:25:26.022911300+00:00
validated: 2026-08-03T19:25:26.022911300+00:00
links:
---

SINTOMA (2026-08-03, Android): o CTA `Próximo` de Nova Venda usava deslocamento inferior constante e ficou sob a tab bar flutuante; tocar no centro abriu Agenda. CAUSA: a ação fixa ignorava altura, offset e safe area da barra. CORREÇÃO CANÔNICA: derivar `bottom` de `floatingTabBarContentPadding(insets.bottom)` e somar esse mesmo clearance ao padding rolável. VALIDAÇÃO: CTA terminou 87 px acima da tab bar e o fluxo Maestro 21 avançou para Forma de pagamento.
