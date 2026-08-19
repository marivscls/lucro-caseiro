---
id: 87aa70df-cde7-4de4-b3af-634b40176203
slug: ui
type: scar
title: Seletores de cor precisam empilhar antes de comprimir ou recortar campos
tags: catalogo, personalizador, responsividade, react-native-web, formulario, overflow
provenance: observado
evidence: apps/mobile/src/features/catalog/components/catalog-customizer.tsx; screenshot da usuária em 2026-08-18; typecheck, ESLint e 11 testes do Catálogo aprovados
decay: stable
created: 2026-08-19T00:23:08.663059700+00:00
updated: 2026-08-19T00:23:08.663059700+00:00
validated: 2026-08-19T00:23:08.663059700+00:00
links:
---

FALHA CORRIGIDA (2026-08-18): no card “Cores da vitrine”, os seletores mantinham minWidth de 180 px dentro de uma grade flexível; em viewport estreito, os campos da primeira linha ficavam comprimidos e o controle à direita avançava visualmente sobre o limite do card. CORREÇÃO: abaixo de 520 px, cada ColorField ocupa 100% da largura; acima disso, preserva a grade. O container do Input usa minWidth: 0 e o cabeçalho aceita wrap. COMO EVITAR: em grids de formulários responsivos no React Native Web, definir explicitamente o breakpoint de empilhamento e permitir que filhos flex encolham.
