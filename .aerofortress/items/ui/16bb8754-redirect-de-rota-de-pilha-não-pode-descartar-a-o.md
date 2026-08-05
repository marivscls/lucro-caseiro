---
id: 16bb8754-171d-4948-955f-2ba0b2910505
slug: ui
type: scar
title: Redirect de rota de pilha não pode descartar a origem do botão Voltar
tags: mobile, navigation, expo-router, back-stack, finance
provenance: observado
evidence: apps/mobile/src/app/finance.tsx; apps/mobile/src/app/tabs/more.tsx; apps/mobile/.maestro/flows/04-more-navigation.yaml
decay: stable
created: 2026-08-03T19:25:26.051117400+00:00
updated: 2026-08-03T19:25:26.051117400+00:00
validated: 2026-08-03T19:25:26.051117400+00:00
links:
---

SINTOMA (2026-08-03): ao abrir Financeiro pelo menu Mais e voltar, o app caía na Home, enquanto outros atalhos retornavam a Mais. CAUSA: a rota de pilha `/finance` apenas redirecionava para a rota interna `/tabs/finance`, perdendo a origem; apontar o card diretamente para a aba também preservava o comportamento de voltar à aba inicial. CORREÇÃO CANÔNICA: manter o push para `/finance` e fazer essa rota renderizar/reexportar o dashboard diretamente. VALIDAÇÃO: retorno manual mostrou Mais e o Maestro 04 passou Produtos, Financeiro e Receitas com saída 0.
