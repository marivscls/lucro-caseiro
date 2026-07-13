---
id: de744ef8-76f9-4005-957e-e2b195d556d3
slug: design
type: decision
title: Catálogo não exibe mais estampas no topo
tags: catalogo, mobile, personalizacao, ui
provenance: dito
evidence: Pedido e correção visual da usuária em 2026-07-13; apps/mobile/src/app/catalog.tsx; apps/mobile/src/features/catalog/components/hero-preview.tsx
decay: stable
created: 2026-07-13T20:39:34.054115900+00:00
updated: 2026-07-13T20:42:49.463017+00:00
validated: 2026-07-13T20:42:49.463017+00:00
links:
---

A seleção e a renderização de estampas foram removidas da prévia de configuração do Catálogo por serem desnecessárias. A divulgação da personalização Profissional também não deve listar “Estampas no topo”. Ao salvar as personalizações, o app envia `pattern: null` para limpar uma estampa previamente persistida; cores, capa, logo e frase permanecem.
