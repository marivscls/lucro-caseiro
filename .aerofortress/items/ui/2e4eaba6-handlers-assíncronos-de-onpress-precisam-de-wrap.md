---
id: 2e4eaba6-5039-4691-9e73-148bc89b9dbe
slug: ui
type: scar
title: Handlers assíncronos de onPress precisam de wrapper void
tags: react-native, typescript, eslint, onPress, async
provenance: observado
evidence: apps/mobile/src/app/quotes.tsx; ESLint de 2026-07-13 (linha 470) falhou antes do wrapper
decay: stable
created: 2026-07-13T20:34:11.419264600+00:00
updated: 2026-07-13T20:34:11.419264600+00:00
validated: 2026-07-13T20:34:11.419264600+00:00
links:
---

SINTOMA (2026-07-13): ao tornar `handleWhatsApp` assíncrono para aguardar o carregamento do cliente vinculado ao orçamento, o ESLint falhou com `@typescript-eslint/no-misused-promises` porque a função que retorna Promise foi passada diretamente a `onPress`. CORREÇÃO: manter o handler assíncrono e passar um callback síncrono `onPress={() => { void handleWhatsApp(); }}`. COMO EVITAR: em props de evento React Native tipadas para retorno `void`, nunca passar diretamente uma função async; invoque-a dentro de wrapper e descarte explicitamente a Promise com `void`.
