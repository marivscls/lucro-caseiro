---
id: ee542538-4d1f-4e24-887e-0e3b5b17b91e
slug: dev
type: scar
title: PRDs novos não podem absorver alterações locais ainda não aprovadas
tags: worktree, prd, escopo, head, mudancas-locais
provenance: dito
evidence: Correção explícita da usuária em 2026-07-25; git status --short mostrou alterações locais extensas
decay: stable
created: 2026-07-25T14:43:33.613980600+00:00
updated: 2026-07-25T14:43:33.613980600+00:00
validated: 2026-07-25T14:43:33.613980600+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-25): ao solicitar um novo PRD e implementação tela por tela, as muitas alterações presentes no worktree ainda não estavam aprovadas e não deveriam ser tratadas como estado canônico nem incluídas no novo escopo. COMO EVITAR: quando o worktree contiver mudanças pendentes de decisão, usar o HEAD commitado como base do diagnóstico e do PRD; preservar os arquivos locais, comparar cada alvo com `git show HEAD:<arquivo>` e isolar qualquer novo diff sem incorporar, reescrever ou justificar alterações não aprovadas.
