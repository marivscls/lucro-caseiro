---
id: e8df5bdf-4111-4f84-82a3-c9f0464925e8
slug: ui
type: scar
title: Home: sombra Android quadrada e ilustração com fundo quebram cards arredondados
tags: 
provenance: dito
evidence: apps/mobile/src/app/tabs/index.tsx; apps/mobile/assets/agenda-deliveries.png
decay: stable
created: 2026-07-10T16:09:14.470065900+00:00
updated: 2026-07-10T16:09:14.470065900+00:00
validated: 2026-07-10T16:09:14.470065900+00:00
links: 
---

Após aproximar a Home da referência, a usuária mostrou que Meta/Estoque ainda tinham um retângulo sombreado atrás dos cantos arredondados e que a ilustração da Agenda carregava fundo. Correção: remover shadow/elevation de getCardStyle na Home, mantendo só superfície opaca, borda e borderRadius; substituir agenda-deliveries.png pela versão ARGB transparente (canto alpha 0). Ao usar ilustração dentro de card arredondado no Android, validar tanto o alpha real do PNG quanto a camada de elevação, que pode denunciar um contêiner quadrado.
