---
id: 1036ce10-e025-4c81-8fc3-35617e5a11e4
slug: ui
type: decision
title: Tela Mais opções usa grade responsiva no computador
tags: mobile, pwa, responsividade, desktop, mais-opcoes, grid
provenance: observado
evidence: apps/mobile/src/app/tabs/more.tsx; pnpm --filter @lucro-caseiro/mobile lint, typecheck e build aprovados em 2026-07-16
decay: stable
created: 2026-07-17T01:56:02.611823500+00:00
updated: 2026-07-17T01:56:02.611823500+00:00
validated: 2026-07-17T01:56:02.611823500+00:00
links:
---

A tela “Mais opções” da PWA mantém uma coluna abaixo de 700 px e, em viewports maiores, distribui os atalhos em 2 a 4 colunas com largura mínima aproximada de 280 px. O conteúdo fica centralizado com largura máxima de 1280 px; a seção diária usa no máximo 3 colunas e a lista geral não estica cards órfãos para a largura inteira.
