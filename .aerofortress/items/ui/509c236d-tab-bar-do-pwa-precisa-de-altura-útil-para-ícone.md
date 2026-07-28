---
id: 509c236d-19be-48f3-b78d-340ed272e4da
slug: ui
type: scar
title: Tab bar do PWA precisa de altura útil para ícone e rótulo
tags: pwa, web, tab-bar, altura, react-navigation, react-native-web, number-of-lines, mobile-nativo
provenance: observado
evidence: apps/mobile/src/shared/layout/floating-tab-bar.ts; apps/mobile/src/app/tabs/_layout.tsx; fonte @react-navigation/bottom-tabs 7.15.8 BottomTabItem.tsx; fonte react-native-web 0.21.2 Text/index.js; segunda captura da usuária; ESLint direcionado e build PWA aprovados
decay: stable
created: 2026-07-26T02:44:18.549613700+00:00
updated: 2026-07-26T02:50:02.259353800+00:00
validated: 2026-07-26T02:50:02.259353800+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): após mudanças na navegação mobile, os rótulos da tab bar ficaram cortados pela metade no PWA estreito. A primeira tentativa — trocar apenas `tabBarItemStyle.overflow` para `visible` na web — NÃO resolveu. CAUSA CONFIRMADA NO FONTE: a barra web herdava 64 px do Android; depois dos 5 px de padding da barra e dos 5 px internos aplicados pelo `BottomTabItem` da React Navigation em cada lado, sobravam 44 px úteis para um wrapper de ícone de 28 px, margem de 3 px e rótulo de 17 px com margem de 3 px (51 px). O `Text numberOfLines={1}` do React Native Web usa `overflow: hidden`, então a linha comprimida era recortada. CORREÇÃO: `FLOATING_TAB_BAR_HEIGHT` usa 72 px somente em `Platform.OS === "web"`, preserva iOS em 88 e Android em 64; a mesma constante aumenta automaticamente a folga inferior das listas. O falso ajuste de overflow foi revertido. COMO EVITAR: calcular a altura útil incluindo os paddings internos da biblioteca e validar a hierarquia renderizada; build verde não substitui validação visual.
