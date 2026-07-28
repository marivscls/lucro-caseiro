---
id: ac61c2d7-05a1-4b76-af76-9c4a1a428989
slug: design
type: decision
title: Serviços usa ilustração 3D no tamanho canônico dos estados vazios
tags: servicos, empty-state, png, ilustracao, responsividade, transparencia
provenance: dito
evidence: apps/mobile/src/app/services.tsx; apps/mobile/src/assets/services-empty-transparent.png; apps/mobile/src/shared/static-image-assets.ts
decay: stable
created: 2026-07-28T22:14:54.992415300+00:00
updated: 2026-07-28T22:24:56.413718+00:00
validated: 2026-07-28T22:24:56.413718+00:00
links:
---

A usuária escolheu a ilustração 3D de uma caixa de ferramentas com checklist, calendário, etiqueta e engrenagem para a tela de Serviços. O arquivo original foi preservado, mas o asset consumido pelo app é `apps/mobile/src/assets/services-empty-transparent.png`: derivado com fundo transparente, 512×512 e 112 KB para não exibir um quadrado escuro nem carregar 1,52 MB. Ele é renderizado em `contain` com 220×220 px no mobile e 240×240 px no desktop e integra o preload estático.
