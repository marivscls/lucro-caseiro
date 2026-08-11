---
id: 868f2cc8-b7f2-470d-b792-3a4c4c1f881d
slug: marketing
type: scar
title: Contrato de carrossel precisa validar a saída da IA
tags: marketing, carrossel, prompt, validacao, ia, copy, ancora
provenance: observado
evidence: apps/api/src/features/marketing/campaign-ai.ts; apps/api/src/features/marketing/marketing.usecases.ts; apps/api/src/features/marketing/campaign-ai.test.ts; apps/api/src/features/marketing/marketing.usecases.test.ts; suíte completa da API 726/726, typecheck e lint sem erros em 2026-08-10
decay: stable
created: 2026-08-11T02:14:43.687607300+00:00
updated: 2026-08-11T02:14:43.687607300+00:00
validated: 2026-08-11T02:14:43.687607300+00:00
links:
---

FALHA REAL (2026-08-10): embora o prompt do copywriter já dissesse que o slide 1 era uma âncora imutável, a IA devolveu uma instrução conflitante para executar todas as gerações 1..N na mesma solicitação, regenerou a capa e ainda truncou copies on-canvas com reticências. CORREÇÃO: productionNotes de carrossel deve começar por um contrato literal de dois estados — sem âncora, gerar somente o slide 1 e encerrar; com a âncora, não regenerar o slide 1 e gerar somente 2..N — e o backend deve validar esse contrato, comandos de lote, assinatura canônica e reticências em blocos de copy. Uma resposta inválida recebe uma única tentativa automática de reparo e continua bloqueada se ainda violar o contrato. COMO EVITAR: regras críticas de execução não podem depender apenas de instrução probabilística; devem ter validação determinística após o parse e teste de integração do reparo.
