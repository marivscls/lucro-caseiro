---
id: 194aee6b-781c-42e4-9faa-7e2bf9d11acd
slug: ui
type: scar
title: Adicionar pedido não exibe cabeçalho decorativo “Dados: pedido”
tags: pedido, modal, formulario, cabecalho, redundancia, ui
provenance: dito
evidence: Captura e pedido da usuária em 2026-07-26; apps/mobile/src/features/orders/components/order-form.tsx
decay: stable
created: 2026-07-26T03:12:42.900895800+00:00
updated: 2026-07-26T03:12:42.900895800+00:00
validated: 2026-07-26T03:12:42.900895800+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-26): o bloco decorativo com ícone de caixa e texto “Dados: pedido” no topo do modal Adicionar pedido não fazia sentido e deveria ser removido. CORREÇÃO CANÔNICA: o conteúdo do formulário começa diretamente pelo primeiro card útil; não reintroduzir um cabeçalho intermediário que apenas repete o contexto já informado pelo título do modal.
