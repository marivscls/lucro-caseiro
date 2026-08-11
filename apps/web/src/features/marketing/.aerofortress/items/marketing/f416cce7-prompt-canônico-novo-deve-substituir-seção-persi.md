---
id: f416cce7-d4bd-49b1-99a2-cac3ed6770c5
slug: marketing
type: scar
title: Prompt canônico novo deve substituir seção persistida antiga
tags: marketing, prompt, persistencia, migracao, guardrail
provenance: observado
evidence: apps/api/src/features/marketing/marketing.usecases.ts; apps/api/src/features/marketing/marketing.domain.test.ts; 21 testes API + 7 testes web, typechecks, lints e builds aprovados em 2026-08-10
decay: stable
created: 2026-08-11T01:54:15.516437700+00:00
updated: 2026-08-11T01:54:15.516437700+00:00
validated: 2026-08-11T01:54:15.516437700+00:00
links:
---

FALHA REAL (2026-08-10): instruções de marketing já persistidas podiam conter uma versão antiga inteira do Visual DNA. marketingSystemPrompt verificava igualdade textual e, ao não reconhecê-la como a versão atual, apenas anexava o novo guardrail; regras antigas e novas passavam juntas à IA e podiam competir. CORREÇÃO: localizar a seção pelo heading canônico `## Direção de arte permanente — Visual DNA aprovado`, remover seu corpo até o próximo heading de nível 2 e inserir a versão atual exatamente uma vez, preservando as demais instruções personalizadas. COMO EVITAR: contratos versionados persistidos devem ser substituídos por identidade de seção, nunca deduplicados apenas pela igualdade do corpo completo.
