---
id: 386ca41e-03ba-4055-972e-e422db86cb40
slug: ui
type: scar
title: Central web: cache pode esconder API offline e fazer mutações parecerem inertes
tags: web, central-de-marketing, api, cache, mutation, erro, rede
provenance: observado
evidence: apps/web/src/shared/lib/api-client.ts; apps/web/src/features/marketing/resource-board.tsx; produção: OPTIONS /api/v1/marketing/ai/resources/draft = 204 e POST sem sessão = 401; lint/typecheck/build web aprovados
decay: stable
created: 2026-07-17T00:26:34.586789400+00:00
updated: 2026-07-17T00:28:49.040006600+00:00
validated: 2026-07-17T00:28:49.040006600+00:00
links:
---

SINTOMA (2026-07-16): na tela de Documentos, “Novo documento” parecia não fazer nada. CAUSA CONFIRMADA: o Next estava ativo e servia leituras previamente cacheadas, mas a API configurada não estava ouvindo; GETs vieram do localStorage e esconderam a indisponibilidade. A mutation de criação não exibia estado pendente nem erro, então a falha era invisível. RECORRÊNCIA (2026-07-16): o preenchimento de Público com IA mostrou o texto técnico `Failed to fetch`; a rota de produção foi verificada depois (preflight 204 e POST sem sessão 401), indicando falha transitória de conexão, mas o `apiClient` repassava o `TypeError` cru do navegador. CORREÇÃO: toda mutation deve mostrar estado pendente e erro; o cliente HTTP deve traduzir falhas de transporte para uma mensagem clara e a ação sem persistência deve permitir nova tentativa. COMO EVITAR: ao depurar mutações na Central, confirmar separadamente porta/endpoint e preflight, pois GETs podem vir do cache; nunca expor mensagens técnicas como `Failed to fetch` ao usuário.
