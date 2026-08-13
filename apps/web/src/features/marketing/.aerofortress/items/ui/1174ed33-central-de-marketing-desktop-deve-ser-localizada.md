---
id: 1174ed33-1902-4183-9e02-4f62b3e9be3f
slug: ui
type: scar
title: Central de Marketing desktop deve ser localizada pelo processo Tauri ativo
tags: central-marketing, tauri, selenita, desktop, web, paridade, correcao-recorrente
provenance: dito
evidence: Correção explícita da usuária em 2026-08-12; processo canônico `npm run dev:lucro-caseiro -w @selenita/desktop`; implementação equivocada em lucro-caseiro/apps/web/src/features/marketing/video-prompt-studio.tsx
decay: stable
created: 2026-08-12T19:04:55.305816+00:00
updated: 2026-08-12T19:14:21.825896400+00:00
validated: 2026-08-12T19:14:21.825896400+00:00
links:
---

CORREÇÕES DA USUÁRIA (2026-08-12, recorrente): a Central de Marketing realmente usada é o desktop Tauri do repositório Selenita, executado por `npm run dev:lucro-caseiro -w @selenita/desktop` na porta 1421. Implementar ou indicar recursos somente em `lucro-caseiro/apps/web` não atende: a usuária não os encontra. REGRA CANÔNICA REFORÇADA: toda nova capacidade da Central de Marketing deve ser implementada no Tauri/Selenita; quando houver trabalho anterior no web, auditar a paridade e portar todas as capacidades ausentes para o desktop. Antes de alterar ou indicar o caminho de uma tela, identificar o processo/surface ativo, localizar o repositório Selenita e validar a opção na navegação visível do Tauri. COMO EVITAR: tratar `apps/web` como outra superfície, nunca como entrega suficiente da Central; concluir somente após build/testes do `@selenita/desktop` e verificação da entrada visível.
