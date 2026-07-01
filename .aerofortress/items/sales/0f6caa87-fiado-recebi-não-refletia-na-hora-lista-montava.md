---
id: 0f6caa87-c001-459b-8279-33021bd5d7c5
slug: sales
type: scar
title: Fiado "Recebi" não refletia na hora — lista montava de todas as vendas + sem update otimista
tags:
provenance: observado
evidence: apps/mobile/src/features/sales/hooks.ts (useUpdateSaleStatus onMutate/onError/onSettled); apps/mobile/src/app/fiado.tsx (pendingSales); commit f65b45b
decay: stable
created: 2026-06-26T00:24:46.227592300+00:00
updated: 2026-06-26T00:24:46.227592300+00:00
validated: 2026-06-26T00:24:46.227592300+00:00
links:
---

SINTOMA: no /fiado, tocar "Recebi" → "Sim, recebi" não mudava a venda pra recebido na hora (parecia que não fazia nada). CAUSA: (1) `useUpdateSaleStatus` só invalidava `["sales"]` no onSuccess — sem update otimista, a linha só sairia quando o refetch voltasse, e qualquer atraso/race dava a sensação de "não atualizou"; (2) a tela de fiado montava os grupos com `groupFiados(sales)` usando TODAS as vendas de `data.items` sem filtrar `status === "pending"` localmente — então mesmo flip de status não removia a linha sozinho. CORREÇÃO: update otimista no hook (mapeia o novo status em todas as listas `["sales"]` do cache em onMutate, rollback em onError, reconcilia em onSettled) + a tela filtra `pendingSales` antes de agrupar. Assim a venda paga some no instante do toque, com rollback se a API falhar. LIÇÃO: pra ação que remove item de uma lista filtrada, faça update otimista E garanta que a tela derive da MESMA condição do filtro (senão o cache muda mas a UI não reflete). Backend (`updateStatus`, filtro `eq(status)`) já estava correto — o bug era de cache/derivação no front.
