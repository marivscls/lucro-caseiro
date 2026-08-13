---
id: 94681886-57a0-49fe-8684-853bbaa01daa
slug: build
type: scar
title: Campos estruturados de prompt devem ser lidos sem regex dinâmica
tags: eslint, sonarjs, regex, prompt, marketing, parser
provenance: observado
evidence: apps/api/src/features/marketing/campaign-ai.ts; lint da API em 2026-08-11
decay: stable
created: 2026-08-11T14:31:21.845068800+00:00
updated: 2026-08-11T14:31:21.845068800+00:00
validated: 2026-08-11T14:31:21.845068800+00:00
links:
---

FALHA REAL (2026-08-11): a primeira validação dos campos do roteiro “Tutorial editorial em passos” criou uma RegExp dinâmica por campo e usou outra expressão com captura aberta para PAPEL NARRATIVO. O lint bloqueou a mudança por security/detect-non-literal-regexp e sonarjs/slow-regex. CORREÇÃO: percorrer as linhas, localizar prefixos literais e extrair o valor com startsWith/slice. COMO EVITAR: para contratos lineares de prompt com rótulos fixos, preferir parsing literal por linha; reservar regex para padrões realmente variáveis e com custo comprovadamente limitado.
