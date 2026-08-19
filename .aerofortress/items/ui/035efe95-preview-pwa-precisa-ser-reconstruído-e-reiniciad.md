---
id: 035efe95-ff91-4e65-936f-570634f66c3f
slug: ui
type: scar
title: Preview PWA precisa ser reconstruído e reiniciado após mudança visual
tags: runtime, pwa, preview, validacao-visual, cache, build, lucro-revenda, operations, catalogo, responsividade
provenance: dito
evidence: apps/mobile/src/features/catalog/components/catalog-customizer.tsx; build:pwa:caseiro 2026-08-18; bundle entry-ffc9fb9961e91058f1925c02833375d5.js; .aerofortress/catalog-color-card-390.png; .aerofortress/catalog-color-card-488.png; preview PID 29160 em http://localhost:8083
decay: stable
created: 2026-08-11T17:33:36.749964900+00:00
updated: 2026-08-19T00:32:08.685110900+00:00
validated: 2026-08-19T00:32:08.685110900+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-11): após remover um subtítulo do login e validar apenas fonte/lint/typecheck, a tela ainda mostrava o texto porque a porta 8083 servia o PWA estático antigo. CORREÇÃO: reconstruir a marca exata, reiniciar seu preview e validar a página e o bundle realmente servidos.

RECORRÊNCIA / CORREÇÃO DA USUÁRIA (2026-08-14): foi informado que o Lucro na Revenda estava na porta 8086, mas a usuária apontou que ali ainda aparecia a versão antiga de Operação da Revenda. CAUSA CONFIRMADA: o build `build:pwa:revenda` que incorporaria `headerShown: false` havia sido interrompido quando a porta foi perguntada; a porta continuou servindo `dist/lucro-revenda` antigo. CORREÇÃO: concluir o build da Revenda, confirmar no bundle novo que a rota `operations` tem `headerShown: false`, reiniciar apenas o preview correto e provar HTTP 200.

NOVA RECORRÊNCIA / CORREÇÃO DA USUÁRIA (2026-08-18): após ajustar no fonte o card “Cores da vitrine” para empilhar abaixo de 520 px, foi afirmado que estava ajustado com base em TypeScript, ESLint e testes, mas a captura da usuária ainda mostrou o layout antigo em duas colunas. CAUSA CONFIRMADA: a porta 8083 executava `node scripts/serve-pwa.mjs lucro-caseiro 8083` sobre o bundle estático anterior; o PWA não havia sido reconstruído. CORREÇÃO VALIDADA: `build:pwa:caseiro` gerou `entry-ffc9fb9961e91058f1925c02833375d5.js`, o preview foi reiniciado e capturas reais em 390 e 488 px mostraram os três campos empilhados, card dentro da viewport e documentWidth igual à viewport.

COMO EVITAR: uma porta ativa só prova que há servidor, não que o pedido entrou. Antes de dizer que uma mudança visual está disponível, exigir três evidências da marca exata: build concluído, bundle servido contendo a mudança e preview reiniciado; para pedido responsivo, acrescentar captura real no viewport afetado.
