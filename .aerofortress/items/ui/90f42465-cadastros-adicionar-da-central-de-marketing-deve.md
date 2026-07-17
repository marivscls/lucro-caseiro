---
id: 90f42465-cbf6-48b3-8cc7-28c8bc06e985
slug: ui
type: rule
title: Cadastros “Adicionar” da Central de Marketing devem oferecer preenchimento por IA
tags: central-de-marketing, formularios, ia, resource-board, ux
provenance: dito
evidence: Pedido da usuária em 2026-07-16 com screenshot do modal “Novo canal de prospecção”; implementação em apps/web/src/features/marketing/resource-board.tsx e apps/api/src/features/marketing/marketing.usecases.ts
decay: stable
created: 2026-07-16T19:29:21.440845+00:00
updated: 2026-07-16T19:29:21.440845+00:00
validated: 2026-07-16T19:29:21.440845+00:00
links:
---

A usuária definiu que todos os modais de “Adicionar” dos quadros da Central de Marketing devem ter duas formas de preenchimento: manual e por IA. A IA deve preparar todos os campos usando a estratégia, os aprendizados e os itens já cadastrados; o resultado volta ao formulário manual para revisão antes de salvar. O padrão é compartilhado pelo ResourceBoard e cobre conteúdo, públicos, funcionalidades, temas, prospecção, campanhas e resultados.
