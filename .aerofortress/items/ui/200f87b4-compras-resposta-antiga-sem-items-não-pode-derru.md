---
id: 200f87b4-0882-4c23-91dc-b6acefe7c850
slug: ui
type: scar
title: Compras: resposta antiga sem items não pode derrubar a listagem
tags: compras, crash, api, compatibilidade, version-skew, mobile
provenance: observado
evidence: apps/mobile/src/features/purchases/api.ts; apps/mobile/src/features/purchases/domain.ts; apps/mobile/src/features/purchases/domain.test.ts; vitest 7/7, ESLint dos 3 arquivos e typecheck mobile aprovados em 2026-07-19
decay: stable
created: 2026-07-19T20:54:22.182958800+00:00
updated: 2026-07-19T20:54:22.182958800+00:00
validated: 2026-07-19T20:54:22.182958800+00:00
links:
---

SINTOMA (2026-07-19): ao abrir a tela de Compras, o app saía/crashava depois de carregar a lista. CAUSA OBSERVADA NO CÓDIGO: o card novo acessava `purchase.items.length`, enquanto a API publicada anterior à feature `purchase_items` podia retornar compras sem a propriedade `items`; o tipo TypeScript mascarava essa diferença de versão. CORREÇÃO: normalizar respostas de listagem, criação e pagamento na fronteira `features/purchases/api.ts`, convertendo `items` ausente ou nulo em `[]`, antes de entregar dados à UI. COMO EVITAR: quando um campo de resposta é adicionado em rollout multiapp, o cliente novo deve modelar o payload de transporte como opcional e normalizá-lo na API local; não confiar no tipo canônico para respostas de servidores ainda não atualizados.
