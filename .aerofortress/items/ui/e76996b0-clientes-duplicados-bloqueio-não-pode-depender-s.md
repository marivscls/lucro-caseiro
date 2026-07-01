---
id: e76996b0-7aa3-4229-ba32-baf8e6af7fd3
slug: ui
type: scar
title: Clientes duplicados: bloqueio não pode depender só da tela/cache
tags: duplicidade, clientes, backend, banco, concorrencia, submit
provenance: dito
evidence: Correção da usuária em 2026-06-30: "voce ainda nao conseguiu ajustar" com screenshot contendo várias entradas Mariana / (27) 99938-3888 mesmo após a primeira correção.
decay: stable
created: 2026-06-30T19:01:09.938403400+00:00
updated: 2026-06-30T22:34:38.081675600+00:00
validated: 2026-06-30T22:34:38.081675600+00:00
links: 
---

Falha real: mesmo depois de adicionar validação por telefone no formulário, refetch no submit, trava síncrona de submit e serialização da mutation, a usuária ainda mostrou a tela com o mesmo cliente cadastrado várias vezes. A lição é que duplicidade de cliente precisa de uma defesa determinística no backend/banco ou em uma operação idempotente/atômica; UI, cache e `isPending` ajudam a experiência, mas não podem ser a garantia principal. Antes de encerrar uma correção de duplicidade, provar que duas requisições equivalentes não criam duas linhas.
