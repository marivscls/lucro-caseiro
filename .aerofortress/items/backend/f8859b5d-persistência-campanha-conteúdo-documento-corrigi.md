---
id: f8859b5d-d0ff-47d6-8b5b-1ad06e2c2e59
slug: backend
type: fact
title: Persistência campanha → conteúdo/documento corrigida no worktree — 2026-08-10
tags: marketing, persistencia, campanhas, conteudo, idempotencia, worktree
provenance: observado
evidence: apps/api/src/features/marketing/marketing.repo.pg.ts; apps/api/src/features/marketing/marketing.routes.ts; apps/web/src/features/marketing/campaign-studio.tsx; apps/api/src/features/marketing/marketing.repo.pg.test.ts
decay: volatile
created: 2026-08-10T13:05:25.281525600+00:00
updated: 2026-08-10T13:23:10.338015500+00:00
validated: 2026-08-10T13:23:10.338015500+00:00
links:
---

A auditoria encontrou marketing_resources vazio em produção e lacunas no código; o worktree foi corrigido, ainda sem publicação. A geração de copies usa merge JSONB para preservar dados anteriores. Publicar variante agora chama uma operação transacional com bloqueio da campanha, cria Conteúdo/Documento e grava savedVariants juntos; repetir devolve o vínculo existente. O Estúdio restaura os destinos após recarga, uma nova estratégia inicia uma nova campanha e os caches corretos são invalidados.
