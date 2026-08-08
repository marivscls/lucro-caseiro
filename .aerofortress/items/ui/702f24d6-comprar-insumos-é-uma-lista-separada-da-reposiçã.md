---
id: 702f24d6-a5d8-43e2-ac98-d657c6786e70
slug: ui
type: decision
title: Comprar insumos é uma lista separada da reposição de produtos
tags: insumos, estoque, lista-de-compras, produtos, mobile, pwa
provenance: dito
evidence: apps/mobile/src/app/buy-materials.tsx; apps/mobile/src/app/materials.tsx; apps/mobile/src/features/materials/domain.ts; testes/lint/typecheck aprovados em 2026-08-08
decay: stable
created: 2026-08-08T21:27:55.258649100+00:00
updated: 2026-08-08T21:27:55.258649100+00:00
validated: 2026-08-08T21:27:55.258649100+00:00
links:
---

A lista derivada de estoque baixo pertence exclusivamente a Insumos e usa o título “Comprar insumos”, evitando confusão com Produtos acabados e com o histórico financeiro de Compras. O aviso de estoque baixo em Insumos abre a tela dedicada, que separa “Sem estoque” de “Estoque baixo”, mostra atual e mínimo, permite selecionar itens e compartilhar; no desktop também copia. Sem itens, as ações somem e o estado vazio oferece “Revisar estoque”. Produtos continuam com o fluxo próprio de repor/produzir.
