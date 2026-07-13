---
id: 545fb5f2-0cef-4a2f-8c84-f585281da191
slug: ui
type: scar
title: Compras: na lista Todas, contas a pagar devem vir antes das pagas
tags: compras, ordenacao, status, a-pagar, pagas
provenance: dito
evidence: Correção da usuária com screenshot em 2026-07-13; apps/mobile/src/app/purchases.tsx; apps/mobile/src/features/purchases/domain.ts; apps/mobile/src/features/purchases/domain.test.ts; typecheck, lint, context lint e 295 testes mobile aprovados
decay: stable
created: 2026-07-13T20:48:42.338238+00:00
updated: 2026-07-13T20:50:17.568179800+00:00
validated: 2026-07-13T20:50:17.568179800+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-13): conforme uma compra é marcada como paga, ela deve descer na aba “Todas”, enquanto as compras ainda “A pagar” sobem e permanecem no topo. CORREÇÃO IMPLEMENTADA: `sortPurchasesPendingFirst` ordena `pending` antes de `paid` em uma cópia da lista, preservando a ordem original dentro de cada grupo; a tela aplica essa ordem antes de renderizar. COMO EVITAR: listagens mistas de Compras devem priorizar pendências; filtros exclusivos continuam naturalmente homogêneos.
