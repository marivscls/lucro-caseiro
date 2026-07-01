---
id: 7971925e-5039-4434-93b3-83885715e13f
slug: ui
type: scar
title: Duplicidade: busca local precisa ser atualizada no submit e na edição
tags: duplicidade, clientes, embalagens, formulario, edicao, refetch
provenance: dito
evidence: Correção da usuária em 2026-06-30: "Clientes ainda nao ta validando" e "Embalagens consegue editar pra uma embalagem que ja existe com os mesmos dados"; arquivos apps/mobile/src/app/tabs/clients.tsx, apps/mobile/src/features/clients/components/edit-client-form.tsx e apps/mobile/src/features/packaging/components/packaging-form.tsx.
decay: stable
created: 2026-06-30T16:57:22.336803400+00:00
updated: 2026-06-30T16:57:22.336803400+00:00
validated: 2026-06-30T16:57:22.336803400+00:00
links: 
---

Falha real: a validação local de duplicidade em Clientes ainda deixava salvar porque dependia do resultado assíncrono anterior de `useClients`, e Embalagens permitia editar para dados já existentes quando a busca local estava atrasada ou só cobria criação. Para evitar repetir, formulários com bloqueio de duplicidade devem aguardar `refetch` no submit antes de comparar e aplicar a mesma regra em criação e edição, excluindo apenas o registro atual.
