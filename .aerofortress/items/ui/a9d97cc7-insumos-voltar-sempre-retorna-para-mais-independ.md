---
id: a9d97cc7-8761-4949-a4d9-c35f11ab0cac
slug: ui
type: scar
title: Insumos: voltar sempre retorna para Mais, independentemente do histórico
tags: insumos, navegação, voltar, mais, expo-router, correcao
provenance: dito
evidence: apps/mobile/src/app/materials.tsx:455,699-700; ESLint direcionado, `pnpm typecheck` e 6 testes de ScreenHeader passaram em 2026-08-18
decay: stable
created: 2026-08-19T02:33:40.214832800+00:00
updated: 2026-08-19T02:33:40.214832800+00:00
validated: 2026-08-19T02:33:40.214832800+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-18): o botão de voltar da tela de Insumos retornava para a Home quando a Home estava no histórico, embora a tela pertença ao menu Mais. CAUSA: `fallbackRoute="/tabs/more"` só era usado quando `router.canGoBack()` era falso; com histórico, o `ScreenHeader` executava `router.back()`. CORREÇÃO CANÔNICA: Insumos fornece `onBack={() => router.replace("/tabs/more")}` e o rótulo acessível `Ir para Mais opções`, tornando o destino determinístico. COMO EVITAR: quando o botão representa retorno estrutural a uma aba específica, não depender apenas de `fallbackRoute`; usar `onBack` explícito no componente da tela e obter o router no mesmo escopo.
