---
id: 25e3b5b9-f809-4d67-9ed2-e24e2ab84193
slug: ui
type: scar
title: Central de Marketing: card com affordance de link precisa ter ação real
tags: web, central-de-marketing, card, navegacao, acessibilidade
provenance: observado
evidence: apps/web/src/features/marketing/resource-board.tsx; apps/web/src/app/globals.css; typecheck e lint web aprovados; /audiences respondeu HTTP 200 no servidor local
decay: stable
created: 2026-07-16T19:18:04.292350500+00:00
updated: 2026-07-16T19:18:04.292350500+00:00
validated: 2026-07-16T19:18:04.292350500+00:00
links:
---

SINTOMA (2026-07-16): os cards de recursos da Central de Marketing exibiam hover e o ícone ArrowUpRight, mas clicar no card não fazia nada. CAUSA: ResourceBoard renderizava apenas um article visual, sem link nem onClick, embora já existisse o editor completo do recurso. CORREÇÃO: adicionar um botão sobreposto acessível que abre o editor do item; manter editar/excluir acima da camada clicável para que suas ações continuem independentes e fornecer foco visível. COMO EVITAR: todo card que usa affordance de navegação (cursor/hover/seta) deve expor uma ação semântica clicável e acessível; se não houver rota de detalhe, ligar ao fluxo canônico existente.
