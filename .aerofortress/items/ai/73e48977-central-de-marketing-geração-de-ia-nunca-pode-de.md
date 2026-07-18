---
id: 73e48977-b854-43f4-89cc-570892fff6f8
slug: ai
type: scar
title: Central de Marketing: geração de IA nunca pode deixar a mutation pendente sem teto
tags: marketing, ia, timeout, abortsignal, react-query, gemini, carregamento, web, api
provenance: observado
evidence: apps/api/src/main.ts; apps/web/src/shared/lib/api-client.ts; apps/web/src/features/marketing/resource-board.tsx; apps/web/src/shared/lib/api-client.test.ts; chamada autenticada real em 2026-07-18 retornou HTTP 200 em 27058 ms; 612 testes API + 4 testes web, typechecks, lint e build web aprovados.
decay: stable
created: 2026-07-18T04:23:36.355099200+00:00
updated: 2026-07-18T04:23:36.355099200+00:00
validated: 2026-07-18T04:23:36.355099200+00:00
links:
---

SINTOMA (2026-07-18): ao usar “Preencher com IA” no editor de Conteúdo, o botão ficava em “Gerando…” indefinidamente. CAUSA: o `apiClient` fazia `fetch` sem timeout e a API chamava `generateText` do Gemini sem `abortSignal`; qualquer oscilação mantinha a mutation do React Query em `pending` para sempre. DIAGNÓSTICO: o provedor isolado respondeu em 4,1 s e uma chamada autenticada real a `/api/v1/marketing/ai/resources/draft` respondeu 200 em 27,1 s, confirmando que credencial, modelo e rota funcionavam, mas a operação era longa e desprotegida. CORREÇÃO: timeout canônico de 45 s na geração da API, 55 s nas ações de IA do editor e 30 s como teto padrão do cliente; timeout vira mensagem recuperável e libera os botões. COMO EVITAR: toda integração externa/IA precisa de cancelamento no servidor e de um teto ligeiramente maior no cliente, com teste que prove que a Promise rejeita e o estado pendente termina.
