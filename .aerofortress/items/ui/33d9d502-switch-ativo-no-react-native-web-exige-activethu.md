---
id: 33d9d502-2aa6-4497-a9a4-d5045e38c061
slug: ui
type: scar
title: Switch ativo no React Native Web exige activeThumbColor
tags: react-native-web, switch, pwa, acessibilidade
provenance: observado
evidence: apps/mobile/src/app/catalog.tsx; fonte opensrc de react-native-web@0.21.2 packages/react-native-web/src/exports/Switch/index.js; .aerofortress/catalog-layout-8083-390-bottom.png
decay: stable
created: 2026-08-17T01:04:37.767376600+00:00
updated: 2026-08-17T01:04:37.767376600+00:00
validated: 2026-08-17T01:04:37.767376600+00:00
links:
---

FALHA CORRIGIDA (2026-08-16): definir apenas `thumbColor` no `Switch` compartilhado não removeu o thumb teal no estado ativo do PWA. No React Native Web 0.21.2, `thumbColor` alimenta o estado inativo e o estado ativo usa `activeThumbColor`, cujo padrão é `#009688`. A correção canônica é fornecer `activeThumbColor` explicitamente (com wrapper tipado local quando os tipos compartilhados não expõem a prop) e confirmar o resultado em captura real; preserve também `aria-checked` e `accessibilityState`.
