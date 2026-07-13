---
id: 0018cfde-5aae-4693-833d-e0a3d641e0f2
slug: backend
type: scar
title: App aparentou resetar após alteração de plano, mas a API Railway estava sem aplicação
tags: railway, api, outage, application-not-found, plano, sql, dados
provenance: observado
evidence: curl em 2026-07-13: lucro-caseiroapi-production.up.railway.app/api/v1/health/ → HTTP 404, Server railway-hikari, x-railway-fallback:true, {message:'Application not found'}; screenshot da usuária mostra erro de carregamento em todas as contas
decay: stable
created: 2026-07-13T20:18:47.346912200+00:00
updated: 2026-07-13T20:23:24.764834200+00:00
validated: 2026-07-13T20:23:24.764834200+00:00
links:
---

SINTOMA (2026-07-13): logo após executar `UPDATE public.users SET plan='professional', plan_expires_at=NOW()+INTERVAL '1 year' WHERE LOWER(email)=...`, a usuária percebeu a conta como resetada; em seguida confirmou que TODAS as contas exibiam 0 itens e “Algo deu errado / Não foi possível carregar”. CAUSA OBSERVADA: não era reset no banco nem efeito global do UPDATE. O domínio configurado no app, `https://lucro-caseiroapi-production.up.railway.app`, respondia em `/api/v1/health/` com HTTP 404 da borda Railway, header `x-railway-fallback: true` e corpo `Application not found`. O domínio alternativo conhecido do catálogo também retornava o mesmo. COMO EVITAR: diante de dados aparentemente zerados em várias contas, distinguir estado vazio de erro de carregamento e testar primeiro o health da API; não executar SQL corretivo nem restaurar dados antes de confirmar disponibilidade do backend. Alteração manual de assinatura ainda deve preservar estado e retornar/verificar a linha afetada.
