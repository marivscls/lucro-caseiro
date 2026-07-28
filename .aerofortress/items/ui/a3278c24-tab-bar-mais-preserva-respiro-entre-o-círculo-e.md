---
id: a3278c24-0ed5-495c-983a-1186c4bdb019
slug: ui
type: scar
title: Tab bar: Mais preserva respiro entre o círculo e o rótulo
tags: tab-bar, mais, espacamento, icone, rotulo, mobile
provenance: dito
evidence: Correção da usuária em 2026-07-25; apps/mobile/src/app/tabs/_layout.tsx
decay: stable
created: 2026-07-25T21:20:10.780736800+00:00
updated: 2026-07-25T21:20:10.780736800+00:00
validated: 2026-07-25T21:20:10.780736800+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): no item `Mais` da barra global, o círculo de 36 px do ícone terminava encostado no rótulo. CORREÇÃO CANÔNICA: manter o círculo e acrescentar 4 px de `marginBottom` no estilo exclusivo `moreIcon`, criando respiro sem mudar o espaçamento dos demais itens. COMO EVITAR: ícones com superfície maior que os ícones comuns da tab bar precisam de espaçamento vertical próprio em relação ao rótulo.
