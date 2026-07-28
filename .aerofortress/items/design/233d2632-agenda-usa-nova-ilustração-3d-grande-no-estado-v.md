---
id: 233d2632-aeaf-4ee1-bfa0-e33d5ff245e7
slug: design
type: decision
title: Agenda usa nova ilustração 3D grande no estado vazio
tags: agenda, empty-state, png, ilustracao, tamanho, pwa, cache
provenance: dito
evidence: Pedido e arquivo fornecidos pela usuária em 2026-07-25; apps/mobile/src/assets/agenda-empty-v3.png; apps/mobile/src/app/tabs/agenda.tsx
decay: stable
created: 2026-07-25T23:31:51.736039400+00:00
updated: 2026-07-25T23:40:33.684956700+00:00
validated: 2026-07-25T23:40:33.684956700+00:00
links:
---

A usuária substituiu novamente a ilustração do estado vazio da Agenda em 2026-07-25, escolhendo o arquivo `ChatGPT Image Jul 25, 2026, 08_35_35 PM.png`, com caixa, calendário, checklist e caneta. O asset canônico atualizado é `apps/mobile/src/assets/agenda-empty-v3.png`, PNG ARGB transparente de 1024×1024, renderizado em `220×220` px com `resizeMode="contain"` em `apps/mobile/src/app/tabs/agenda.tsx`, igual ao destaque das outras telas. O nome versionado evita que o PWA reutilize o bitmap anterior em cache.
