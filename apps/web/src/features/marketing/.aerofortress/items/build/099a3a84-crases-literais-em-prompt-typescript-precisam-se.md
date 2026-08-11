---
id: 099a3a84-1efd-4e91-94e0-4aca8a8a0d3f
slug: build
type: scar
title: Crases literais em prompt TypeScript precisam ser escapadas
tags: typescript, template-literal, prompt, prettier, marketing
provenance: observado
evidence: apps/api/src/features/marketing/marketing.system-prompt.ts; falha do Prettier seguida de 20/20 testes, typecheck e Prettier aprovados em 2026-08-10
decay: stable
created: 2026-08-11T01:46:30.896303300+00:00
updated: 2026-08-11T01:46:30.896303300+00:00
validated: 2026-08-11T01:46:30.896303300+00:00
links:
---

FALHA REAL (2026-08-10): ao adicionar os marcadores Markdown `1/N` dentro de VISUAL_ART_DIRECTION_GUARDRAIL, uma template string TypeScript delimitada por crases, o Prettier falhou com SyntaxError porque as crases internas encerraram a string. CORREÇÃO: escapar cada crase literal como \` no fonte e repetir testes, typecheck e formatação. COMO EVITAR: ao editar prompts longos declarados como template literals, escapar exemplos Markdown com crase ou usar aspas tipográficas quando o caractere literal não for requisito.
