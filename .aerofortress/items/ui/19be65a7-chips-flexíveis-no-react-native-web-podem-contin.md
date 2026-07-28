---
id: 19be65a7-9ec4-4811-9a7b-8ccaf2123b86
slug: ui
type: scar
title: Chips flexíveis no React Native Web podem continuar transbordando
tags: responsive, react-native-web, chip, overflow
provenance: observado
evidence: .codex-logs/products-ui-validation/products-mobile.png e products-mobile-fixed.png; apps/mobile/src/app/products.tsx
decay: stable
created: 2026-07-25T03:57:39.385282600+00:00
updated: 2026-07-25T03:58:58.936669300+00:00
validated: 2026-07-25T03:58:58.936669300+00:00
links:
---

SINTOMA OBSERVADO (2026-07-25): após substituir os carrosséis de filtros de Produtos por duas linhas responsivas, a captura em 390 px cortava o terceiro tipo (`Kits`) e parte da ordenação. A primeira tentativa com `flex: 1`, `flexBasis: 0` e `minWidth: 0` não corrigiu o bundle web: os controles continuaram largos e cortados. CORREÇÃO CANÔNICA: para uma quantidade pequena de ações, deixar `Chip`/`Pressable` com largura intrínseca, remover a distribuição `flex: 1` dos itens e usar `flexWrap: "wrap"` no contêiner. COMO EVITAR: toda barra de ações deve ser capturada em viewport mobile real; não presumir que distribuição igualitária do React Native encolherá conteúdo intrínseco na web, e preferir largura pelo conteúdo quando os rótulos já cabem.
