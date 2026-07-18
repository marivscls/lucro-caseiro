---
id: 86150768-fd29-4b91-ae21-62ef8e192af3
slug: ui
type: scar
title: Banco de ideias: coleções assíncronas devem iniciar vazias
tags: web, marketing, ia, react-query, runtime, fast-refresh
provenance: observado
evidence: commit 2cec51a; apps/web/src/features/marketing/content-brief-editor.tsx; .aerofortress/web-dev-3002.err.log
decay: stable
created: 2026-07-17T14:13:23.497170600+00:00
updated: 2026-07-17T14:20:39.045860300+00:00
validated: 2026-07-17T14:20:39.045860300+00:00
links:
---

SINTOMA (2026-07-17): a tela de Conteúdo registrou `Cannot read properties of undefined (reading 'length')` em `ContentBriefEditor`, fazendo os controles de IA parecerem inertes. CAUSA: durante Fast Refresh/compatibilidade entre versões, a prop `ideas` chegou indefinida e o componente acessou `ideas.length` diretamente. CORREÇÃO: definir `ideas = []` na fronteira do componente e manter o chamador usando `contentIdeas.data?.ideas ?? []`. COMO EVITAR: toda coleção proveniente de mutation/query deve ter valor vazio seguro na fronteira visual, mesmo quando o tipo estático a declare obrigatória.
