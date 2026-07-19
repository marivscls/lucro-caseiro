---
id: 581ff6b2-5b53-4c00-9935-dc6db26fd91a
slug: ui
type: scar
title: PWA: textAlignVertical e paddingVertical não centralizam TextInput multiline
tags: pwa, react-native-web, textarea, multiline, alinhamento
provenance: dito
evidence: apps/mobile/src/features/labels/components/food-label-fields.tsx; duas capturas/correções enviadas pela usuária em 2026-07-19
decay: stable
created: 2026-07-19T18:02:56.762485600+00:00
updated: 2026-07-19T18:06:45.262265400+00:00
validated: 2026-07-19T18:06:45.262265400+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-07-19): após pedir centralização vertical nos campos do rótulo, `textAlignVertical: "center"` não alterou os `textarea` do PWA. Uma segunda tentativa com o atalho `paddingVertical` também deixou origem, alergênicos, aditivos, conservação e preparo no topo. CAUSA: o textarea do React Native Web não honra `textAlignVertical` e o shorthand não produziu o posicionamento visual necessário nesse componente. CORREÇÃO: manter alinhamento horizontal à esquerda e definir `lineHeight`, `paddingTop` e `paddingBottom` explicitamente, proporcionais à altura de cada campo multiline. PREVENÇÃO: para centralização vertical no PWA, validar os campos multiline separadamente e usar propriedades físicas explícitas; não assumir paridade com TextInput nativo nem com inputs de uma linha.
