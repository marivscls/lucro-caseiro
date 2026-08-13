---
id: 2c933cd6-9e4b-48ea-a389-e663246bbc59
slug: geral
type: scar
title: Sugestão automática deve preservar o formato escolhido na ideia
tags: marketing, ideias, video, formato, sugestao-automatica, correcao
provenance: dito
evidence: C:\Users\maria\Documents\projects\selenita\apps\desktop\src\ResourceBoard.tsx; C:\Users\maria\Documents\projects\selenita\backends\Selenita.Api\Modules\Marketing\MarketingAiApplication.cs; ResourceBoard.test.tsx 13/13 e backend focado 27/27 em 2026-08-12
decay: stable
created: 2026-08-12T18:56:38.008589900+00:00
updated: 2026-08-12T18:56:38.008589900+00:00
validated: 2026-08-12T18:56:38.008589900+00:00
links:
---

FALHA REAL CORRIGIDA (2026-08-12): no modal “Detalhes da ideia”, `suggestAutomatically` chamava `fillWithAi(..., replaceCurrent=true)` e enviava `data: {}`, apagando o formato escolhido pela usuária. Assim, após selecionar “Vídeo para gravação”, a IA podia devolver `carousel` e a interface sobrescrevia a seleção. CORREÇÃO: a sugestão automática envia `data.format` e o `videoBrief` já escolhido como restrições, explicita o formato no pedido, preserva-o na aplicação do retorno e o backend rejeita/repara respostas cujo formato diverge. COMO EVITAR: decisões explícitas feitas em seletores não são conteúdo descartável ao pedir uma nova alternativa; cada fluxo de sugestão deve carregá-las como constraints e ter teste onde a IA tenta contrariá-las.
