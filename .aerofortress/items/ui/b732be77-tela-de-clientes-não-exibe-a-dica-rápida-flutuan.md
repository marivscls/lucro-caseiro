---
id: b732be77-98b1-48a0-a4ec-1ffafc12f99d
slug: ui
type: decision
title: Tela de Clientes não exibe a Dica rápida flutuante
tags: mobile, clientes, ui, tab-bar
provenance: dito
evidence: Pedido explícito da usuária em 2026-08-04; apps/mobile/src/app/tabs/clients.tsx; ESLint direcionado, typecheck mobile e git diff --check aprovados
decay: stable
created: 2026-08-05T02:14:26.461690800+00:00
updated: 2026-08-05T02:17:19.450755300+00:00
validated: 2026-08-05T02:17:19.450755300+00:00
links:
---

DECISÃO DA USUÁRIA (2026-08-04): remover completamente da tela principal de Clientes o card flutuante `Dica rápida` com o texto sobre manter os clientes atualizados. A lista mantém apenas `floatingTabBarContentPadding(0)` como folga inferior no mobile, sem estado, botão de fechar ou overlay adicional. COMO EVITAR: não reintroduzir essa dica flutuante na tela de Clientes.
