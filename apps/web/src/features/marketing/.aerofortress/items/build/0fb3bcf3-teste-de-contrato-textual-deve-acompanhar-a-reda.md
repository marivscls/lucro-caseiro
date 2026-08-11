---
id: 0fb3bcf3-128f-458d-bcc5-cb7767d19d9c
slug: build
type: scar
title: Teste de contrato textual deve acompanhar a redação canônica do prompt
tags: vitest, prompts, contrato, marketing, recorrente
provenance: observado
evidence: apps/api/src/features/marketing/campaign-ai.test.ts; apps/api/src/features/marketing/marketing.domain.test.ts; falha focada observada em 2026-08-10
decay: stable
created: 2026-08-10T17:58:19.675295300+00:00
updated: 2026-08-11T02:44:22.597161500+00:00
validated: 2026-08-11T02:44:22.597161500+00:00
links:
---

FALHA REAL RECORRENTE (2026-08-10): ao reescrever o contrato visual canônico, asserções literais continuaram esperando frases da versão anterior e a suíte focada falhou, embora a regra semântica permanecesse. A falha se repetiu ao trocar a regra genérica de não repetir layout pelo contrato de famílias compositivas. CORREÇÃO: atualizar as asserções no mesmo patch da redação e preservar deliberadamente somente frases que funcionam como invariantes úteis. COMO EVITAR: ao versionar prompts, buscar todas as expectativas textuais relacionadas e rodar a suíte focada antes de typecheck/lint.
