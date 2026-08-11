---
id: 65827d4f-0382-4567-b2e0-15210e967253
slug: marketing
type: scar
title: Personagem IA precisa demonstrar o produto, não virar sequência de retratos
tags: marketing, carrossel, personagem-ia, interface, prompt, validacao, design
provenance: observado
evidence: apps/api/src/features/marketing/marketing.system-prompt.ts; apps/api/src/features/marketing/campaign-ai.ts; apps/api/src/features/marketing/campaign-ai.test.ts; 732 testes da API, typecheck, lint sem erros e build aprovados em 2026-08-11
decay: stable
created: 2026-08-11T03:47:32.198443900+00:00
updated: 2026-08-11T03:47:32.198443900+00:00
validated: 2026-08-11T03:47:32.198443900+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-08-11): ao selecionar “Editorial com personagem IA”, o carrossel podia manter a pessoa em todos os prompts, mas resolver a sequência apenas com fotografias e retratos, sem as telas interativas que demonstram o Lucro Caseiro. CORREÇÃO CANÔNICA: a personagem é o fio narrativo, não o único foco; o carrossel alterna personagem em ação, passo tipográfico, personagem usando dispositivo, interface real confirmada e encerramento editorial. Deve haver ao menos um slide `interface-real` e uma cena explícita de interação personagem-tela, enquanto cada prompt individual repete o contrato positivo. A referência tutorial é uma possibilidade de composição, não um template obrigatório para todos os posts. COMO EVITAR: não tratar a variação apenas como permissão de pessoa; validar também a demonstração do produto e rejeitar sequências compostas só por retratos.
