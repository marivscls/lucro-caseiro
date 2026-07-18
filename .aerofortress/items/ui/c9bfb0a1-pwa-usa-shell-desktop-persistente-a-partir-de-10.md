---
id: c9bfb0a1-93d6-4443-bc7f-a8cfb83fd794
slug: ui
type: decision
title: PWA usa shell desktop persistente a partir de 1024 px
tags: pwa, desktop, sidebar, header, tabela, paginacao, breakpoint
provenance: observado
evidence: apps/mobile/src/shared/components/desktop-shell.tsx; apps/mobile/src/shared/layout/use-desktop-layout.ts; apps/mobile/src/app/_layout.tsx; apps/mobile/src/app/tabs/sales.tsx; apps/mobile/src/app/tabs/clients.tsx; apps/mobile/src/features/products/components/product-list.tsx; typecheck/lint/build verdes; 331 testes existentes + 2 testes de breakpoint aprovados; bundle entry-9a089652d50715b640bf36d523816240.js servido em localhost:8083 com código desktop e mobile
decay: stable
created: 2026-07-17T02:13:17.633462400+00:00
updated: 2026-07-17T02:13:17.633462400+00:00
validated: 2026-07-17T02:13:17.633462400+00:00
links:
---

A adaptação desktop da PWA foi centralizada no layout raiz: em web com viewport ≥1024 px, rotas autenticadas recebem sidebar persistente, header contextual e conteúdo central limitado a 1440 px; rotas públicas continuam sem o shell. A tab bar original é apenas ocultada nesse modo e permanece inalterada abaixo do breakpoint. Vendas e Clientes usam tabelas com paginação do backend no desktop; Produtos usa grade de três colunas com paginação. Um predicado puro testado impede que o shell seja ativado em iOS/Android ou web estreita.
