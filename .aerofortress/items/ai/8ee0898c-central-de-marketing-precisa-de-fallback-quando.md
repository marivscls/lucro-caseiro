---
id: 8ee0898c-836e-4173-a10f-5311faec9f19
slug: ai
type: scar
title: Central de Marketing precisa de fallback quando a cota do modelo principal esgota
tags: marketing, ia, gemini, quota, 429, fallback, flash-lite, railway
provenance: observado
evidence: Railway logs de @lucro-caseiro/api em 2026-07-19 01:59 UTC mostraram statusCode 429, quotaId GenerateRequestsPerDayPerProjectPerModel-FreeTier, quotaValue 20 para gemini-2.5-flash; apps/api/src/features/marketing/marketing-ai.provider.ts; apps/api/src/main.ts; 3 testes, typecheck, lint e build API aprovados; chamada real com as credenciais do serviço retornou FLASH_LITE_RESULT=OK.
decay: stable
created: 2026-07-19T02:05:56.579066900+00:00
updated: 2026-07-19T02:05:56.579066900+00:00
validated: 2026-07-19T02:05:56.579066900+00:00
links:
---

SINTOMA (2026-07-18): ao usar “Preencher com IA” para criar uma Entrevista, a Central respondeu “A IA está temporariamente indisponível”. CAUSA OBSERVADA NOS LOGS DE PRODUÇÃO: `gemini-2.5-flash` devolveu HTTP 429 `RESOURCE_EXHAUSTED` porque a cota gratuita diária de 20 requisições do modelo havia sido consumida; o AI SDK repetiu a mesma chamada e a API converteu qualquer falha no mesmo 503 genérico. CORREÇÃO: geração de marketing tenta `gemini-2.5-flash` e, se falhar, usa `gemini-2.5-flash-lite` dentro do mesmo teto de 45 segundos, sem retries automáticos duplicados; se ambos estiverem sem cota, a mensagem informa limite de uso em vez de indisponibilidade vaga. COMO EVITAR: integrações de IA em produção não podem depender de uma única cota gratuita nem esconder 429 como falha genérica; manter fallback testado, telemetria do modelo realmente usado e mensagem específica quando todos os modelos esgotarem.
