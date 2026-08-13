---
id: 099a3a84-1efd-4e91-94e0-4aca8a8a0d3f
slug: build
type: scar
title: Crases literais em prompt TypeScript precisam ser escapadas
tags: typescript, template-literal, prompt, prettier, marketing, recorrente
provenance: observado
evidence: apps/api/src/features/marketing/marketing.system-prompt.ts; falha do Prettier e do Vitest observada em 2026-08-12
decay: stable
created: 2026-08-11T01:46:30.896303300+00:00
updated: 2026-08-12T03:18:24.273895400+00:00
validated: 2026-08-12T03:18:24.273895400+00:00
links:
---

FALHA REAL RECORRENTE (2026-08-10; repetida em 2026-08-12): ao adicionar exemplos Markdown dentro de VISUAL_ART_DIRECTION_GUARDRAIL, uma template string TypeScript delimitada por crases, as crases internas encerraram a string e o Prettier/Vitest falharam antes de executar testes. CORREÇÃO: escapar cada crase literal como \` no fonte e repetir formatação, testes e typecheck. COMO EVITAR: antes de rodar a suíte, revisar toda alteração em prompts longos declarados como template literals e escapar exemplos Markdown com crase ou usar aspas tipográficas quando o caractere literal não for requisito.
