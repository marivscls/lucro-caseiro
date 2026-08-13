---
id: 0fb3bcf3-128f-458d-bcc5-cb7767d19d9c
slug: build
type: scar
title: Teste de contrato textual deve acompanhar a redação canônica do prompt
tags: vitest, prompts, contrato, marketing, recorrente, fixtures
provenance: observado
evidence: apps/api/src/features/marketing/campaign-ai.test.ts; apps/api/src/features/marketing/marketing.domain.test.ts; apps/api/src/features/marketing/marketing.usecases.test.ts; falha da suíte completa de marketing observada em 2026-08-12
decay: stable
created: 2026-08-10T17:58:19.675295300+00:00
updated: 2026-08-12T03:26:07.620179800+00:00
validated: 2026-08-12T03:26:07.620179800+00:00
links:
---

FALHA REAL RECORRENTE (2026-08-10, 2026-08-11 e 2026-08-12): ao reescrever ou ampliar o contrato visual canônico, fixtures e asserções literais continuaram produzindo ou esperando a versão anterior. Em 2026-08-12, o reparo de carrossel no teste de use case não incluiu o novo campo estruturado GESTO LIMA; a segunda resposta simulada continuou inválida e parseSucceeded ficou falso. CORREÇÃO: atualizar no mesmo patch todas as fixtures de geração, reparo, persistência e asserções que materializam o contrato, preservando somente frases que funcionam como invariantes úteis. COMO EVITAR: ao versionar prompts, buscar expectativas e bundles simulados em toda a feature e rodar a suíte completa do domínio, não apenas os testes do módulo editado.
