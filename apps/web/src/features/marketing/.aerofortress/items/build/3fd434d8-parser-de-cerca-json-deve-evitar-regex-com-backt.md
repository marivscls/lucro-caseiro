---
id: 3fd434d8-ac17-40ff-81a7-792fe0a39c83
slug: build
type: scar
title: Parser de cerca JSON deve evitar regex com backtracking
tags: lint, sonar, regex, openai
provenance: observado
evidence: apps/api/src/features/marketing/openai-video-editor.ts; `pnpm --filter @lucro-caseiro/api lint` falhou e depois passou.
decay: stable
created: 2026-08-12T19:25:33.370308500+00:00
updated: 2026-08-12T19:25:33.370308500+00:00
validated: 2026-08-12T19:25:33.370308500+00:00
links:
---

FALHA REAL (2026-08-12): o lint da API bloqueou o parser de respostas do editor com `sonarjs/slow-regex` ao remover cercas Markdown por uma regex com espaços variáveis. CORREÇÃO: fazer o parse determinístico com `trim`, `startsWith`, `indexOf`, `slice` e `endsWith`. COMO EVITAR: em saídas potencialmente grandes de IA, preferir operações lineares de string a regexes com quantificadores em torno de espaços ou conteúdo variável.
