---
id: 0a5400fc-b336-40c7-962a-7671e390932b
slug: ui
type: decision
title: Home usa hierarquia compacta com resumo financeiro vinho
tags: home, mobile, dashboard, onboarding, financeiro, meta, navegacao, progresso
provenance: observado
evidence: apps/mobile/src/app/tabs/index.tsx:482; typecheck e lint direcionado aprovados; 5 testes de goals aprovados; build:pwa:caseiro gerou entry-d84c286fb5eed3a9a1a05f1cba484ec3.js e preview http://127.0.0.1:8094 respondeu 200 em 2026-08-16
decay: stable
created: 2026-07-10T16:06:13.007554800+00:00
updated: 2026-08-16T17:02:09.383474+00:00
validated: 2026-08-16T17:02:09.383474+00:00
links:
---

A Home canônica foi redesenhada diretamente em `apps/mobile/src/app/tabs/index.tsx`: cabeçalho compacto com nome/data/avatar; card de próximo passo ligado ao progresso real de produto/venda; seletor Hoje/Mês; hero financeiro vinho; meta mensal; quatro atalhos; e orientação de produto apenas quando não duplica o onboarding. Hoje usa `useTodaySummary` e um resumo financeiro paginado do dia; Mês usa `useInsights(1)` e `useFinanceSummary`; a meta usa `useProlaboreStatus`. A navegação inferior preserva Início/Vendas/Nova venda/Agenda/Mais e ganhou ação central circular.

No card da meta mensal, `progressPct` real é limitado entre 0 e 100, mantém trilho cinza-claro e preenchimento verde-lima proporcional, e posiciona uma pílula verde-lima de 44×24 px sobre a barra. A distribuição flexível do espaço restante prende a pílula ao início em 0%, ao fim em 100% e acompanha valores intermediários sem ultrapassar o card; não existe porcentagem duplicada abaixo da barra.
