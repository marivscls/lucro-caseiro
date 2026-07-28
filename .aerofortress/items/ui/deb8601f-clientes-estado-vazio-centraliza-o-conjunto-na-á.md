---
id: deb8601f-451c-4711-9cd2-a6c7c9a5fd41
slug: ui
type: scar
title: Clientes: estado vazio centraliza o conjunto na área útil
tags: clientes, empty-state, centralizacao, layout, mobile, scrollview
provenance: dito
evidence: Correção solicitada pela usuária em 2026-07-25; apps/mobile/src/app/tabs/clients.tsx
decay: stable
created: 2026-07-25T20:46:17.460109200+00:00
updated: 2026-07-25T20:46:17.460109200+00:00
validated: 2026-07-25T20:46:17.460109200+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): após ampliar a ilustração do estado vazio de Clientes, o conjunto de imagem, título, descrição e botão ficou alto demais, logo abaixo da busca. CORREÇÃO CANÔNICA: o `ScrollView` usa `contentContainerStyle.flexGrow: 1` e o `EmptyState` preserva seu `flex: 1`, centralizando o conjunto no espaço útil restante entre cabeçalho/busca e os elementos inferiores. COMO EVITAR: não neutralizar o `flex` compartilhado com `style={{ flex: undefined }}` nem ajustar cada item com margens fixas; centralizar o bloco como unidade responsiva.
