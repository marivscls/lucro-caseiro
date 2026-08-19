---
id: 9c8598d8-414b-49a4-bd9e-1038db38d3aa
slug: ui
type: scar
title: Cards da vitrine pública não podem combinar altura percentual com grid esticada
tags:
provenance: observado
evidence: apps/api/src/features/catalog/storefront-renderer.ts
decay: stable
created: 2026-08-19T01:14:36.629330800+00:00
updated: 2026-08-19T01:14:36.629330800+00:00
validated: 2026-08-19T01:14:36.629330800+00:00
links:
---

FALHA CORRIGIDA (2026-08-18): os cards do renderer público ficavam centenas de pixels mais altos que o conteúdo. A causa era a combinação de `.item-body { height: 100% }`, CTA com `margin-top: auto`/transform e o esticamento padrão das linhas/itens da grid. CORREÇÃO CANÔNICA: grid com `align-items: start` e `grid-auto-rows: auto`; card e body com `height: auto; min-height: 0`; CTA logo após o conteúdo, sem transform. Validar alturas em 768–1024 px, onde duas colunas expõem mais o problema.
