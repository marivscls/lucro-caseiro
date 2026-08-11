---
id: 6b3f57be-3e10-421c-9a33-0ebb9986d419
slug: marketing
type: scar
title: Prompt total do carrossel deve ser a concatenação literal dos prompts individuais
tags: marketing, carrossel, prompt, slides, consistência, validação
provenance: dito
evidence: apps/api/src/features/marketing/campaign-ai.ts; packages/contracts/src/schemas/marketing.ts; relato e imagens enviados pela usuária em 2026-08-10
decay: stable
created: 2026-08-11T02:33:24.036407500+00:00
updated: 2026-08-11T02:33:24.036407500+00:00
validated: 2026-08-11T02:33:24.036407500+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-10): um prompt geral redigido ou resumido separadamente fez a geração produzir slides que não se complementavam e não correspondiam ao assunto, enquanto os prompts individuais de cada slide funcionavam melhor. CORREÇÃO CANÔNICA: os prompts individuais completos, ordenados de 1..N, são a fonte de verdade; o prompt total deve ser construído deterministicamente por contrato global + concatenação literal de TODOS os prompts individuais, sem paráfrase, condensação ou nova geração pela IA. COMO EVITAR: estruturar a saída com slidePrompts, validar quantidade e ordem e testar igualdade exata da composição final.
