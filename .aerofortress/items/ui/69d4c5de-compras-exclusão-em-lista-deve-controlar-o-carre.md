---
id: 69d4c5de-8aca-4894-9aef-e0d053935063
slug: ui
type: scar
title: Compras: exclusão em lista deve controlar o carregamento pelo ID
tags: compras, exclusao, loading, react-query, lista
provenance: observado
evidence: Relato e screenshot da usuária em 2026-07-13; apps/mobile/src/app/purchases.tsx; apps/mobile/src/features/purchases/components/purchase-card.tsx; typecheck, lint e 294 testes mobile aprovados
decay: stable
created: 2026-07-13T20:47:31.883718+00:00
updated: 2026-07-13T20:47:31.883718+00:00
validated: 2026-07-13T20:47:31.883718+00:00
links:
---

SINTOMA (2026-07-13): ao excluir uma compra, vários cards aparentavam carregar antes de apenas a compra escolhida ser removida. CAUSA ESTRUTURAL OBSERVADA: o fluxo de exclusão não mantinha o ID em processamento; uma mutation compartilhada pela lista não distingue qual card originou a ação. CORREÇÃO: manter `deletingId` + `deletingIdRef`, usar a ref como trava síncrona contra um segundo disparo, passar `isDeleting` por comparação de ID e deixar somente o card selecionado mostrar “Excluindo...”; os demais botões ficam temporariamente desabilitados. COMO EVITAR: ações assíncronas em listas devem associar o estado visual ao ID do registro, nunca renderizar loading em todos os cards a partir de um `isPending` global.
