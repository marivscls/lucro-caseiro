---
id: 581ff6b2-5b53-4c00-9935-dc6db26fd91a
slug: ui
type: scar
title: PWA: textAlignVertical e paddingVertical não centralizam TextInput multiline
tags: pwa, react-native-web, textarea, multiline, placeholder, etiquetas, alinhamento
provenance: dito
evidence: apps/mobile/src/app/labels.tsx; apps/mobile/src/features/labels/components/create-label-form.tsx; captura C:\Users\maria\AppData\Roaming\AeroFortress\constellation\tmp\5b744c25-8f12-4ae9-9b6d-40e78875a2ed.png; correções da usuária em 2026-07-19 e 2026-07-20
decay: stable
created: 2026-07-19T18:02:56.762485600+00:00
updated: 2026-07-20T21:55:02.981297800+00:00
validated: 2026-07-20T21:55:02.981297800+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-07-19): após pedir centralização vertical nos campos do rótulo, `textAlignVertical: "center"` não alterou os `textarea` do PWA. Uma segunda tentativa com o atalho `paddingVertical` também deixou origem, alergênicos, aditivos, conservação e preparo no topo. RECORRÊNCIA (2026-07-20): o campo “Observação (opcional)” da Etiqueta ainda mostrava o placeholder “Ex: Manter refrigerado” grudado no topo tanto na criação quanto na edição.

CAUSA: o textarea do React Native Web não honra `textAlignVertical` e o shorthand não produz o posicionamento visual necessário nesse componente.

CORREÇÃO: manter alinhamento horizontal à esquerda e declarar propriedades físicas explícitas. No campo de observação, criação e edição usam altura 88, `lineHeight: 24`, `paddingTop: 32`, `paddingBottom: 32` e `textAlignVertical: "center"` para preservar o Android.

PREVENÇÃO: para centralização vertical no PWA, validar cada campo multiline separadamente e usar `lineHeight`, `paddingTop` e `paddingBottom` explícitos; não assumir paridade com TextInput nativo nem com inputs de uma linha.
