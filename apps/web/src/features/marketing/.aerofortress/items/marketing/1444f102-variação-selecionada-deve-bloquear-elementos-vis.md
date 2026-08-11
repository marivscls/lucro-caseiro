---
id: 1444f102-88d5-481b-b93e-c60eaa3a548d
slug: marketing
type: scar
title: Variação selecionada deve bloquear elementos visuais incompatíveis
tags: marketing, carrossel, variacoes, prompt, personagem-ia, validacao
provenance: observado
evidence: apps/api/src/features/marketing/marketing.system-prompt.ts; apps/api/src/features/marketing/campaign-ai.ts; apps/api/src/features/marketing/campaign-ai.test.ts; apps/api/src/features/marketing/marketing.domain.test.ts; 28 testes focados, typecheck, lint sem erros e Prettier aprovados em 2026-08-11
decay: stable
created: 2026-08-11T03:05:11.692374900+00:00
updated: 2026-08-11T03:35:34.463859900+00:00
validated: 2026-08-11T03:35:34.463859900+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-11): prompts de todas as variações continuavam incluindo personagem humana, mesmo sem selecionar “Editorial com personagem IA”. CORREÇÃO CANÔNICA IMPLEMENTADA: a variação escolhida é um contrato exclusivo que prevalece sobre o Visual DNA genérico; pessoa ou personagem humana gerada por IA só é permitida em “Editorial com personagem IA”. Nas demais variações, todo prompt individual deve repetir a proibição literal de pessoa, personagem, rosto, corpo, mãos humanas e retrato gerados por IA. O Visual DNA usa produto, serviço sem figura humana, ambiente, objetos, tipografia ou interface real como foco padrão. A validação determinística exige que cada slide repita a variação selecionada e o guardrail não humano, rejeitando ainda instruções positivas como “personagem consistente”, fotografia humana e mãos trabalhando. COMO EVITAR: nunca declarar fotografia/personagem humana como padrão global; propagar a variação até cada prompt e validar a saída antes de disponibilizá-la.
