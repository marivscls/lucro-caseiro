---
id: c9ef2a08-ace7-4c4f-ba75-129d308bdbfe
slug: design
type: decision
title: Insumos usa card de despensa com PNG e listagem compacta por status
tags: ui, insumos, pwa, estoque
provenance: observado
evidence: apps/mobile/src/app/materials.tsx; apps/mobile/src/features/materials/components/material-card.tsx; apps/mobile/src/features/materials/domain.ts; apps/mobile/src/assets/insumos-despensa.png
decay: seasonal
created: 2026-08-19T00:48:35.474321100+00:00
updated: 2026-08-19T00:48:35.474321100+00:00
validated: 2026-08-19T00:48:35.474321100+00:00
links:
---

A tela canônica de Insumos vive em `/tabs/materials` para preservar a navbar oficial e mantém `/materials` como redirecionamento. O topo usa card vinho com valor real do estoque, contadores `ok/attention/low` e o PNG transparente `insumos-despensa.png` ancorado no canto inferior direito; abaixo ficam alerta dinâmico, busca, chips roláveis, categorias derivadas da família da unidade e ordenação. A lista usa um único contêiner com divisores e linhas compactas, preserva `IngredientAvatar`, `MaterialForm`, `/buy-materials` e `useAdjustMaterial`. Status: baixo quando atual <= mínimo, atenção até 120% do mínimo e em dia acima disso; valor = quantidade atual × custo por unidade.
