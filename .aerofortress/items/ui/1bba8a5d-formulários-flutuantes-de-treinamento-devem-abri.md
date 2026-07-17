---
id: 1bba8a5d-56fe-4a1e-aa8a-c80c93b7ac8b
slug: ui
type: scar
title: Formulários flutuantes de treinamento devem abrir centralizados no viewport
tags: web, central-de-marketing, treinamento-ia, formulario, layout, responsivo
provenance: observado
evidence: apps/web/src/app/globals.css; pedido da usuária com screenshot em 2026-07-16; lint, typecheck web e Prettier aprovados
decay: stable
created: 2026-07-16T19:26:54.903325400+00:00
updated: 2026-07-16T19:26:54.903325400+00:00
validated: 2026-07-16T19:26:54.903325400+00:00
links:
---

SINTOMA (2026-07-16): os formulários acionados na tela “Treinamento da inteligência” abriam encostados à lateral direita no desktop, fora do foco principal da página. CAUSA: `.inline-creator` usava `position: absolute`, `right: 40px` e margem superior, ancorando o formulário na borda. CORREÇÃO: centralizar no viewport com `position: fixed`, `top/left: 50%` e `transform: translate(-50%, -50%)`; no breakpoint móvel, remover o transform e preservar os insets e a rolagem do formulário. COMO EVITAR: formulários flutuantes que funcionam como diálogo devem usar o viewport como referência no desktop e redefinir explicitamente transform/insets no mobile.
