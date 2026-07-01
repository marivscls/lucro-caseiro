---
id: f72ef558-b586-4626-8a6c-b6d3b6b1c185
slug: ui
type: scar
title: Fiado: trocar empty state sem remover background blur deixa PNG antigo aparecendo
tags: ui, assets, fiado
provenance: dito
evidence: Correção da usuária em 2026-06-28: "so esqueceu de remover o porco maior do fundo"; arquivo afetado: apps/mobile/src/app/fiado.tsx
decay: stable
created: 2026-06-29T01:11:46.836023600+00:00
updated: 2026-06-29T01:11:46.836023600+00:00
validated: 2026-06-29T01:11:46.836023600+00:00
links: 
---

Ao substituir ilustrações/PNGs de uma tela, verificar também imagens decorativas de fundo, overlays e heroes com blur/opacidade. No fiado, o empty state foi trocado para o porquinho 3D novo, mas o `fiadoHero` ainda era renderizado como background blur em tela cheia, deixando o porco antigo/grande aparente atrás do conteúdo.
