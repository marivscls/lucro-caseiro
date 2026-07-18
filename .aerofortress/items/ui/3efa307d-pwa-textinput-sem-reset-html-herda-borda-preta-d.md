---
id: 3efa307d-186e-4278-b8a3-e4e8fde741c1
slug: ui
type: scar
title: PWA: TextInput sem reset HTML herda borda preta do navegador
tags: pwa, react-native-web, textinput, input, textarea, css-reset, foco, formularios, todas-as-telas
provenance: observado
evidence: apps/mobile/public/index.html; export Expo web aprovado; captura Chromium 1440×900 da tela de login sem bordas pretas; 98 usos em 38 arquivos/telas inventariados; typecheck mobile aprovado em 2026-07-17
decay: stable
created: 2026-07-17T13:52:15.445581+00:00
updated: 2026-07-17T13:52:15.445581+00:00
validated: 2026-07-17T13:52:15.445581+00:00
links: 
---

SINTOMA (2026-07-17): todos os campos do PWA exibiam um retângulo/borda preta dentro dos contêineres estilizados, visível primeiro na Precificação. CAUSA: `TextInput` do React Native Web vira `<input>`/`<textarea>` e o `apps/mobile/public/index.html` customizado não removia `margin`, `border` e `outline` nativos do navegador. CORREÇÃO CANÔNICA: no `#expo-reset`, zerar `margin`, `border` e `outline` de `input, textarea`, mantendo foco por teclado com `:focus-visible` rosa e `outline-offset: -2px`. A regra cobre os TextInput diretos e o componente `Input` compartilhado sem alterar Android/iOS; estilos inline que definem bordas próprias continuam prevalecendo. COMO EVITAR: ao customizar o HTML base/export do Expo, preservar também o reset de controles nativos e validar ao menos um campo direto e um `Input` compartilhado no export servido.
